import { Actividad, CreateActividadDTO, UpdateActividadDTO } from '../../domain/entities/Actividad';
import { apiFetch } from './ApiClient';
import { SyncEngine } from '../sync/SyncEngine';
import { CicloRepository } from './CicloRepository';

interface CicloResolution {
  // Id real del ciclo activo, o un placeholder `{{opId}}` (ver
  // SyncEngine.dependencyToken) si el ciclo activo todavía está pendiente
  // de sincronizar — en ese caso `dependsOnOpId` indica qué operación hay
  // que esperar para poder sustituirlo por el id real.
  cicloId?: number | string;
  dependsOnOpId?: string;
}

// Si no viene un cicloId explícito, se intenta resolver el ciclo activo de
// la parcela (igual que hace el backend cuando hay conexión) para asociar
// la actividad automáticamente — así, igual que online, la actividad queda
// dentro del ciclo y el backend le calcula la fase correspondiente con su
// trigger. Si no hay ningún ciclo activo se deja sin ciclo: es una
// actividad suelta, sin fase, y es un caso válido (la base de datos ya no
// lo rechaza).
//
// El ciclo activo puede él mismo estar pendiente de sincronizar (id
// temporal, negativo) — p. ej. se inició offline en esta misma sesión. En
// ese caso no se puede mandar ese id tal cual (el backend nunca lo va a
// reconocer); se manda el placeholder de dependencia y se marca la
// operación para que no se intente hasta que ese ciclo se haya
// sincronizado y se conozca su id real (ver SyncEngine.flushQueue).
async function resolverCiclo(parcelaId: number, cicloIdExplicito?: number): Promise<CicloResolution> {
  if (cicloIdExplicito) return { cicloId: cicloIdExplicito };
  const ciclos = await CicloRepository.getByParcela(parcelaId).catch(() => [] as any[]);
  const activo = (ciclos as any[]).find(c => c.estado === 'activo');
  if (!activo) return {};
  if (activo.id > 0) return { cicloId: activo.id };

  const record = await SyncEngine.findLocalRecord('ciclo', activo.id);
  if (!record) return {};
  return { cicloId: SyncEngine.dependencyToken(record.queuedOpId), dependsOnOpId: record.queuedOpId };
}

interface PaginatedActividades {
  data: Actividad[];
  total: number;
  page: number;
  pageSize: number;
}

function synthesizeLocal(tempId: number, parcelaId: number, data: Omit<CreateActividadDTO, 'cicloId'> & { cicloId?: number | string }): Actividad {
  return {
    id:                   tempId,
    parcelaId,
    capaId:                data.capaId ?? null,
    // Si cicloId es un placeholder de dependencia (string), todavía no se
    // conoce el id real — se muestra localmente como "sin ciclo" hasta que
    // la sincronización lo resuelva y el próximo pull() traiga la versión
    // real (con su fase ya calculada por el backend).
    cicloId:                typeof data.cicloId === 'number' ? data.cicloId : null,
    tipo:                   (data.tipo ?? 'observacion') as Actividad['tipo'],
    fecha:                  data.fecha ?? new Date().toISOString(),
    estado:                 data.estado ?? 'pendiente',
    ordenPlantilla:          data.ordenPlantilla ?? null,
    insumo:                  data.insumo ?? null,
    cantidad:                data.cantidad ?? null,
    unidad:                  data.unidad ?? null,
    metodo:                  data.metodo ?? null,
    nivelAlerta:             data.nivelAlerta ?? null,
    observaciones:           data.observaciones ?? null,
    productos:               data.productos as any,
    detalleRiego:            data.detalleRiego ?? null,
    detalleFumigacion:       data.detalleFumigacion ?? null,
    detalleFertilizacion:    data.detalleFertilizacion ?? null,
    detalleCosecha:          data.detalleCosecha ?? null,
    detalleManoObra:         data.detalleManoObra ?? null,
    detalleMaquinaria:       data.detalleMaquinaria ?? null,
    costoInsumos:            data.costoInsumos ?? null,
    costoTotalActividad:     data.costoTotalActividad ?? null,
    pendingSync:             true,
  } as Actividad;
}

// Una actividad con id<0 todavía no existe en el servidor: puede venir de
// `create()` (su propia operación POST sigue en cola) o haber sido generada
// junto con la plantilla al iniciar un ciclo offline (comparte `queuedOpId`
// con la operación "iniciar ciclo" — ver CicloRepository.iniciarCicloOffline).
// Distinguir el caso importa porque en el segundo, una sola operación crea
// VARIAS actividades a la vez, así que hace falta la clave compuesta
// `opId:ordenPlantilla` (ver SyncEngine.dependencyToken) para apuntar a la
// correcta una vez sincronizada; en el primero, el opId de la actividad ya
// es único.
async function resolverTokenPendiente(record: { queuedOpId: string; data: any }): Promise<string> {
  const queue = await SyncEngine.getQueue();
  const parentOp = queue.find(op => op.id === record.queuedOpId);
  return parentOp?.entity === 'ciclo'
    ? SyncEngine.dependencyToken(record.queuedOpId, record.data.ordenPlantilla)
    : SyncEngine.dependencyToken(record.queuedOpId);
}

export const ActividadRepository = {

  getByParcela: async (parcelaId: number, page?: number, pageSize?: number): Promise<Actividad[]> => {
    const pendientes = (await SyncEngine.getLocalRecords('actividad'))
      .filter(r => (r.data as Actividad).parcelaId === parcelaId)
      .map(r => r.data as Actividad);

    if (parcelaId < 0) {
      // La parcela todavía no existe en el servidor: no tiene sentido
      // consultar la red con un id que nunca va a encontrar.
      return pendientes;
    }

    const query = page ? `?page=${page}&pageSize=${pageSize ?? 20}` : '';
    try {
      const res = await apiFetch(`/parcelas/${parcelaId}/actividades${query}`);
      if (!res.ok) {
        await res.text().catch(() => {});
        throw new Error('Error al obtener actividades');
      }
      const json: PaginatedActividades = await res.json();
      return [...pendientes, ...(json.data ?? [])];
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
    }

    // Offline: replicar la misma regla que aplica el backend (ver
    // GetActividadesByParcela) — si hay un ciclo activo, se muestran SOLO
    // sus actividades (las de su plantilla, unas pocas); si no hay ninguno,
    // el histórico completo. Sin este filtro, `cached.actividades` trae
    // TODO lo alguna vez sincronizado de esta parcela (incluyendo ciclos ya
    // finalizados), y se mezclaba con las del ciclo recién iniciado offline
    // — p. ej. un ciclo "resoca" con 5 actividades de plantilla aparecía
    // junto con las 11 de un "siembra_boleo" anterior.
    const cached = await SyncEngine.getCached();
    const cacheParcela = cached.actividades.filter((a: any) => (a.parcelaId ?? a.parcela_id) === parcelaId);

    const ciclos = await CicloRepository.getByParcela(parcelaId);
    const cicloActivo = (ciclos as any[]).find(c => c.estado === 'activo');
    if (!cicloActivo) return [...pendientes, ...cacheParcela];

    return [
      ...pendientes.filter(a => a.cicloId === cicloActivo.id),
      ...cacheParcela.filter((a: any) => (a.cicloId ?? a.ciclo_id) === cicloActivo.id),
    ];
  },

  create: async (parcelaId: number, data: CreateActividadDTO): Promise<Actividad> => {
    if (parcelaId < 0) {
      // La parcela en sí todavía no se sincronizó — no hay id real contra
      // el cual intentar la red. Se encola como dependiente: solo se
      // enviará después de que la creación de esa parcela se sincronice
      // (ver SyncEngine.flushQueue). Si además ya se inició un ciclo
      // offline para esta misma parcela, la actividad se engancha a él
      // (con su propio placeholder de dependencia) para que le quede
      // asignada la fase correcta al sincronizar — igual que pasaría
      // online.
      const parent = await SyncEngine.findLocalRecord('parcela', parcelaId);
      if (!parent) throw new Error('No se encontró la parcela pendiente de sincronizar.');

      const { cicloId, dependsOnOpId: cicloOpId } = await resolverCiclo(parcelaId, data.cicloId);
      const body = { ...data, cicloId };
      const dependsOnOpIds = cicloOpId ? [parent.queuedOpId, cicloOpId] : [parent.queuedOpId];

      const tempId = SyncEngine.nextTempId();
      const opId = await SyncEngine.enqueue({
        entity: 'actividad', method: 'POST',
        path: `/parcelas/${SyncEngine.dependencyToken(parent.queuedOpId)}/actividades`,
        body,
        label: `Nueva actividad (${body.tipo ?? 'sin tipo'}) — parcela pendiente de sincronizar`,
        dependsOnOpIds,
      });
      const local = synthesizeLocal(tempId, parcelaId, body);
      await SyncEngine.addLocalRecord('actividad', tempId, local, opId);
      return local;
    }

    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${parcelaId}/actividades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;

      // Antes de encolar: si no hay cicloId explícito, se intenta resolver
      // el ciclo activo contra la caché (ver resolverCiclo arriba). Si ese
      // ciclo activo está en sí mismo pendiente de sincronizar, se manda un
      // placeholder y la actividad espera a que el ciclo se sincronice
      // primero — así nunca se queda "pendiente" para siempre por faltarle
      // el ciclo.
      const { cicloId, dependsOnOpId } = await resolverCiclo(parcelaId, data.cicloId);
      const body = { ...data, cicloId };

      const tempId = SyncEngine.nextTempId();
      const opId = await SyncEngine.enqueue({
        entity: 'actividad', method: 'POST', path: `/parcelas/${parcelaId}/actividades`, body,
        label: `Nueva actividad (${body.tipo ?? 'sin tipo'}) parcela #${parcelaId}`,
        dependsOnOpIds: dependsOnOpId ? [dependsOnOpId] : undefined,
      });
      const local = synthesizeLocal(tempId, parcelaId, body);
      await SyncEngine.addLocalRecord('actividad', tempId, local, opId);
      return local;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear actividad');
    return json;
  },

  update: async (parcelaId: number, id: number, data: UpdateActividadDTO): Promise<Actividad> => {
    if (id < 0) {
      const record = await SyncEngine.findLocalRecord('actividad', id);
      if (!record) throw new Error('Esta actividad todavía no se sincronizó. Espera a tener conexión.');

      const token = await resolverTokenPendiente(record);
      await SyncEngine.enqueue({
        entity: 'actividad', method: 'PUT',
        path: `/parcelas/${parcelaId}/actividades/${token}`,
        body: data,
        label: `Editar actividad (${(record.data as any).tipo ?? 'sin tipo'}) — pendiente de sincronizar`,
        dependsOnOpIds: [record.queuedOpId],
      });

      const updated = await SyncEngine.updateLocalRecord('actividad', id, data);
      return updated!.data as Actividad;
    }

    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${parcelaId}/actividades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'actividad', method: 'PUT', path: `/parcelas/${parcelaId}/actividades/${id}`, body: data,
        label: `Editar actividad #${id}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar actividad');
    return json;
  },

  delete: async (parcelaId: number, id: number): Promise<void> => {
    if (id < 0) {
      const record = await SyncEngine.findLocalRecord('actividad', id);
      if (!record) throw new Error('Esta actividad todavía no se sincronizó. Espera a tener conexión.');

      const queue = await SyncEngine.getQueue();
      const parentOp = queue.find(op => op.id === record.queuedOpId);
      if (parentOp?.entity === 'actividad' && parentOp.method === 'POST') {
        // Esta actividad nunca llegó a mandarse: basta con descartar su
        // propia creación en cola, no hace falta avisarle al servidor.
        await SyncEngine.discardOperation(record.queuedOpId);
        return;
      }

      const token = await resolverTokenPendiente(record);
      await SyncEngine.enqueue({
        entity: 'actividad', method: 'DELETE',
        path: `/parcelas/${parcelaId}/actividades/${token}`,
        label: `Eliminar actividad (${(record.data as any).tipo ?? 'sin tipo'}) — pendiente de sincronizar`,
        dependsOnOpIds: [record.queuedOpId],
      });
      // Solo se quita ESTE registro local: removeLocalRecordByOpId borraría
      // también las demás actividades de la plantilla que comparten el
      // opId del ciclo (si este id venía de ahí).
      await SyncEngine.removeLocalRecord('actividad', id);
      return;
    }
    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${parcelaId}/actividades/${id}`, { method: 'DELETE' });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'actividad', method: 'DELETE', path: `/parcelas/${parcelaId}/actividades/${id}`,
        label: `Eliminar actividad #${id}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar actividad');
  },
};
