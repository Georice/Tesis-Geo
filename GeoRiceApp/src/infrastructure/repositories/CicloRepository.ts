import { apiFetch } from './ApiClient';
import { SyncEngine } from '../sync/SyncEngine';

type TipoCiclo = 'siembra_boleo' | 'siembra_trasplante' | 'soca' | 'resoca';

interface ItemPlantilla {
  tipo: string;
  orden: number;
  diasDesdeInicio: number;
  descripcion: string;
}

// Espejo de PLANTILLAS_CICLO (backend: domain/entities/PlantillaCiclo.ts).
// Se necesita duplicada acá para poder generar las actividades del ciclo
// offline — si el backend cambia la plantilla, hay que replicar el cambio
// acá también.
const PLANTILLAS_CICLO: Record<TipoCiclo, ItemPlantilla[]> = {
  siembra_boleo: [
    { tipo: 'preparacion_suelo',  orden: 1,  diasDesdeInicio: 0,   descripcion: 'Preparación del suelo con rastra o maquinaria' },
    { tipo: 'inundacion',         orden: 2,  diasDesdeInicio: 3,   descripcion: 'Inundación del terreno antes de la siembra' },
    { tipo: 'siembra_boleo',      orden: 3,  diasDesdeInicio: 7,   descripcion: 'Siembra al voleo de la semilla de arroz' },
    { tipo: 'riego',              orden: 4,  diasDesdeInicio: 15,  descripcion: 'Primer riego post siembra' },
    { tipo: 'fertilizacion',      orden: 5,  diasDesdeInicio: 20,  descripcion: 'Primera fertilización (arranque)' },
    { tipo: 'deshierba',          orden: 6,  diasDesdeInicio: 25,  descripcion: 'Control de malezas' },
    { tipo: 'fumigacion',         orden: 7,  diasDesdeInicio: 35,  descripcion: 'Primera fumigación preventiva' },
    { tipo: 'fertilizacion',      orden: 8,  diasDesdeInicio: 45,  descripcion: 'Segunda fertilización (engrose)' },
    { tipo: 'fumigacion',         orden: 9,  diasDesdeInicio: 60,  descripcion: 'Segunda fumigación si hay plagas' },
    { tipo: 'riego',              orden: 10, diasDesdeInicio: 70,  descripcion: 'Riego de llenado de grano' },
    { tipo: 'cosecha',            orden: 11, diasDesdeInicio: 110, descripcion: 'Cosecha del ciclo principal' },
  ],
  siembra_trasplante: [
    { tipo: 'preparacion_suelo',  orden: 1,  diasDesdeInicio: 0,   descripcion: 'Preparación del suelo' },
    { tipo: 'inundacion',         orden: 2,  diasDesdeInicio: 3,   descripcion: 'Inundación del terreno' },
    { tipo: 'siembra_trasplante', orden: 3,  diasDesdeInicio: 25,  descripcion: 'Trasplante de plántulas al campo definitivo' },
    { tipo: 'riego',              orden: 4,  diasDesdeInicio: 30,  descripcion: 'Primer riego post trasplante' },
    { tipo: 'fertilizacion',      orden: 5,  diasDesdeInicio: 35,  descripcion: 'Primera fertilización (arranque)' },
    { tipo: 'deshierba',          orden: 6,  diasDesdeInicio: 40,  descripcion: 'Control de malezas' },
    { tipo: 'fumigacion',         orden: 7,  diasDesdeInicio: 50,  descripcion: 'Primera fumigación preventiva' },
    { tipo: 'fertilizacion',      orden: 8,  diasDesdeInicio: 60,  descripcion: 'Segunda fertilización (engrose)' },
    { tipo: 'fumigacion',         orden: 9,  diasDesdeInicio: 75,  descripcion: 'Segunda fumigación si hay plagas' },
    { tipo: 'riego',              orden: 10, diasDesdeInicio: 85,  descripcion: 'Riego de llenado de grano' },
    { tipo: 'cosecha',            orden: 11, diasDesdeInicio: 120, descripcion: 'Cosecha del ciclo principal' },
  ],
  soca: [
    { tipo: 'rozar_quemar',       orden: 1, diasDesdeInicio: 0,  descripcion: 'Rozar y quemar el rastrojo del ciclo anterior' },
    { tipo: 'soca_riego',         orden: 2, diasDesdeInicio: 5,  descripcion: 'Primer riego del ciclo soca' },
    { tipo: 'soca_fertilizacion', orden: 3, diasDesdeInicio: 15, descripcion: 'Fertilización del ciclo soca' },
    { tipo: 'soca_fumigacion',    orden: 4, diasDesdeInicio: 25, descripcion: 'Fumigación preventiva soca' },
    { tipo: 'soca_riego',         orden: 5, diasDesdeInicio: 35, descripcion: 'Segundo riego soca' },
    { tipo: 'soca_fumigacion',    orden: 6, diasDesdeInicio: 50, descripcion: 'Segunda fumigación si hay plagas' },
    { tipo: 'cosecha_soca',       orden: 7, diasDesdeInicio: 75, descripcion: 'Cosecha del ciclo soca' },
  ],
  resoca: [
    { tipo: 'rozar_quemar',       orden: 1, diasDesdeInicio: 0,  descripcion: 'Rozar y quemar el rastrojo' },
    { tipo: 'soca_riego',         orden: 2, diasDesdeInicio: 5,  descripcion: 'Primer riego resoca' },
    { tipo: 'soca_fertilizacion', orden: 3, diasDesdeInicio: 15, descripcion: 'Fertilización resoca' },
    { tipo: 'soca_riego',         orden: 4, diasDesdeInicio: 30, descripcion: 'Segundo riego resoca' },
    { tipo: 'cosecha_soca',       orden: 5, diasDesdeInicio: 65, descripcion: 'Cosecha resoca' },
  ],
};

interface IniciarCicloDatos {
  tipo: string; fechaInicio: string; variedadSemilla?: string;
  areaSembrada?: number; observaciones?: string;
}

// Genera localmente el ciclo + las actividades de su plantilla (mismo
// resultado que produciría el servidor), con IDs temporales, y encola UNA
// sola operación (la misma que haría "iniciar ciclo" online) — el servidor
// crea todo de nuevo al sincronizar, con las fases correctas calculadas por
// su trigger. Las actividades locales quedan sin fase mientras tanto (se
// muestran en "Sin fase" y se corrigen solas al sincronizar).
async function iniciarCicloOffline(parcelaId: number, data: IniciarCicloDatos) {
  let path = `/parcelas/${parcelaId}/ciclos`;
  let dependsOnOpIds: string[] | undefined;

  if (parcelaId < 0) {
    const parent = await SyncEngine.findLocalRecord('parcela', parcelaId);
    if (!parent) throw new Error('No se encontró la parcela pendiente de sincronizar.');
    path = `/parcelas/${SyncEngine.dependencyToken(parent.queuedOpId)}/ciclos`;
    dependsOnOpIds = [parent.queuedOpId];
  }

  const opId = await SyncEngine.enqueue({
    entity: 'ciclo', method: 'POST', path, body: data, dependsOnOpIds,
    label: `Iniciar ciclo (${data.tipo}) — ${parcelaId < 0 ? 'parcela pendiente de sincronizar' : 'parcela #' + parcelaId}`,
  });

  const cicloTempId = SyncEngine.nextTempId();
  const ciclo = {
    id: cicloTempId, parcelaId, tipo: data.tipo, estado: 'activo',
    fechaInicio: data.fechaInicio, fechaFin: null,
    variedadSemilla: data.variedadSemilla ?? null, areaSembrada: data.areaSembrada ?? null,
    observaciones: data.observaciones ?? null,
    pendingSync: true,
  };
  await SyncEngine.addLocalRecord('ciclo', cicloTempId, ciclo, opId);

  const plantilla = PLANTILLAS_CICLO[data.tipo as TipoCiclo] ?? [];
  const actividades = plantilla.map((item, i) => {
    const fecha = new Date(data.fechaInicio);
    fecha.setDate(fecha.getDate() + item.diasDesdeInicio);
    const actividadTempId = cicloTempId - i - 1; // únicos y estables dentro de este ciclo
    return {
      id: actividadTempId, parcelaId, cicloId: cicloTempId,
      tipo: item.tipo, fecha: fecha.toISOString(),
      ordenPlantilla: item.orden, observaciones: item.descripcion,
      nivelAlerta: 'normal', estado: 'pendiente',
      fase: null, faseId: null,
      pendingSync: true,
    };
  });
  for (const actividad of actividades) {
    await SyncEngine.addLocalRecord('actividad', actividad.id, actividad, opId);
  }

  return { ciclo, actividades };
}

// Nota de diseño: iniciar/finalizar un ciclo dispara lógica de negocio en
// el backend (genera hasta 11 actividades según la plantilla, y calcula la
// fase de cada una con un trigger de base de datos). iniciar() SÍ funciona
// offline: genera localmente lo mismo que generaría el servidor, sin fases
// (se completan solas al sincronizar). finalizar() sigue exigiendo
// conexión — es una edición simple, no hay nada que sintetizar.
//
// Importante: el try/catch de cada método cubre SOLO la llamada a
// apiFetch(...). Si el servidor respondió (incluso con un error de negocio,
// p.ej. "Ciclo no encontrado" o 404), eso NO se confunde con falta de
// conexión — se propaga el mensaje real del servidor.
export const CicloRepository = {
  getByParcela: async (parcelaId: number): Promise<any[]> => {
    const pendientes = (await SyncEngine.getLocalRecords('ciclo'))
      .filter(r => r.data.parcelaId === parcelaId)
      .map(r => r.data);

    if (parcelaId < 0) return pendientes;

    let base: any[];
    try {
      const res = await apiFetch(`/parcelas/${parcelaId}/ciclos`);
      if (!res.ok) {
        await res.text().catch(() => {});
        throw new Error('Error al obtener ciclos');
      }
      base = await res.json();
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      const cached = await SyncEngine.getCached();
      base = cached.ciclos.filter((c: any) => (c.parcelaId ?? c.parcela_id) === parcelaId);
    }
    return [...pendientes, ...base];
  },

  iniciar: async (parcelaId: number, data: IniciarCicloDatos): Promise<{ ciclo: any; actividades: any[] }> => {
    const yaActivo = (await CicloRepository.getByParcela(parcelaId)).some((c: any) => c.estado === 'activo');
    if (yaActivo) {
      throw new Error('Esta parcela ya tiene un ciclo activo. Finaliza el ciclo actual antes de iniciar uno nuevo.');
    }

    if (parcelaId < 0) {
      return iniciarCicloOffline(parcelaId, data);
    }

    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${parcelaId}/ciclos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      return iniciarCicloOffline(parcelaId, data);
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'No se pudo iniciar el ciclo');
    return json;
  },

  finalizar: async (parcelaId: number, cicloId: number): Promise<void> => {
    if (cicloId < 0) throw new Error('Este ciclo todavía no se sincronizó. Espera a tener conexión.');
    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${parcelaId}/ciclos/${cicloId}/finalizar`, { method: 'PUT' });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      throw new Error('Finalizar el ciclo requiere conexión a internet. Intenta de nuevo cuando tengas señal.');
    }
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? 'No se pudo finalizar el ciclo');
    }
    // Sin esto, la caché offline (SYNC_DATA) sigue mostrando este ciclo con
    // estado "activo" hasta el próximo login/resetAndPull — y si justo
    // después se pierde la conexión e intenta iniciarse un ciclo nuevo,
    // getByParcela() cae a esa caché desactualizada y lo bloquea/marca como
    // si el ciclo recién finalizado siguiera activo.
    const json = await res.json().catch(() => null);
    await SyncEngine.patchCachedEntity('ciclos', cicloId, { estado: json?.estado ?? 'finalizado' });
  },
};
