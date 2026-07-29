import { Parcela, CreateParcelaDTO, UpdateParcelaDTO } from '../../domain/entities/Parcela';
import { apiFetch } from './ApiClient';
import { SyncEngine } from '../sync/SyncEngine';

function mapParcela(item: any): Parcela {
  return {
    p_id:             item.id            ?? item.p_id,
    p_nombre:         item.nombre        ?? item.p_nombre,
    p_propietario:    item.propietario_nombre ?? item.propietario ?? item.p_propietario,
    p_cultivo:        item.cultivo       ?? item.p_cultivo,
    p_estado:         item.estado        ?? item.p_estado,
    p_area_ha:        item.areaHa        ?? item.area_ha        ?? item.p_area_ha,
    p_zona_id:        item.zonaId        ?? item.zona_id        ?? item.p_zona_id,
    p_fecha_creacion: item.fechaCreacion ?? item.fecha_creacion ?? item.p_fecha_creacion,
    p_geometria:      item.geometria     ?? item.p_geometria,
  };
}

// Nota de diseño (repetida en los demás repositorios offline-aware): el
// try/catch cubre ÚNICAMENTE la llamada a apiFetch(...). Si el servidor
// respondió (aunque sea con un error de negocio, 4xx/5xx) eso NO entra al
// catch — se resuelve fuera, con el mensaje real. Solo un fallo real de
// apiFetch (sin red, DNS, timeout, o SESSION_EXPIRED) activa caché/cola.
export const ParcelaRepository = {

  getAll: async (): Promise<Parcela[]> => {
    let base: Parcela[];
    try {
      const res = await apiFetch('/parcelas');
      if (!res.ok) throw new Error(`GET /parcelas falló: ${res.status}`);
      const data: any[] = await res.json();
      base = data.map(mapParcela);
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      const cached = await SyncEngine.getCached();
      base = cached.parcelas.map(mapParcela);
    }
    // Las parcelas creadas offline se muestran de inmediato (id temporal),
    // sin importar si la lectura de arriba vino de la red o de la caché —
    // siguen pendientes hasta que su POST real se sincronice.
    const pendientes = await SyncEngine.getLocalRecords('parcela');
    return [...pendientes.map(r => r.data as Parcela), ...base];
  },

  create: async (data: CreateParcelaDTO): Promise<Parcela> => {
    let res: Response;
    try {
      res = await apiFetch('/parcelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;

      const tempId = SyncEngine.nextTempId();
      const opId = await SyncEngine.enqueue({
        entity: 'parcela', method: 'POST', path: '/parcelas', body: data,
        label: `Nueva parcela: ${data.nombre}`,
      });
      const local: Parcela = {
        p_id:             tempId,
        p_nombre:         data.nombre,
        p_propietario:    data.propietario ?? '',
        p_cultivo:        data.cultivo,
        p_estado:         data.estado,
        p_area_ha:        0,
        p_zona_id:        data.zonaId ?? null,
        p_fecha_creacion: new Date().toISOString(),
        p_geometria:      data.geometria,
        p_pending_sync:   true,
      };
      await SyncEngine.addLocalRecord('parcela', tempId, local, opId);
      return local;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear parcela');
    // Sin esto, la caché offline (SYNC_DATA) no se entera de esta parcela
    // hasta el próximo login/resetAndPull — si se pierde la señal antes de
    // eso, getAll() cae a esa caché vieja y la parcela recién creada no
    // aparece (ver SyncEngine.getCached más abajo).
    await SyncEngine.upsertCachedEntity('parcelas', json);
    return json;
  },

  update: async (id: number, data: UpdateParcelaDTO): Promise<Parcela> => {
    if (id < 0) throw new Error('Esta parcela todavía no se sincronizó. Espera a tener conexión.');
    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'parcela', method: 'PUT', path: `/parcelas/${id}`, body: data,
        label: `Editar parcela #${id}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar parcela');
    // Igual que en create(): corrige la caché de una vez para que una
    // lectura offline inmediatamente después no siga mostrando los datos
    // de antes de esta edición.
    await SyncEngine.upsertCachedEntity('parcelas', json);
    return json;
  },

  updateGeometry: async (id: number, geometria: object): Promise<Parcela> => {
    if (id < 0) throw new Error('Esta parcela todavía no se sincronizó. Espera a tener conexión.');
    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${id}/geometry`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geometria }),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'parcela', method: 'PUT', path: `/parcelas/${id}/geometry`, body: { geometria },
        label: `Editar geometría parcela #${id}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar geometría');
    await SyncEngine.upsertCachedEntity('parcelas', json);
    return json;
  },

  delete: async (id: number): Promise<void> => {
    if (id < 0) throw new Error('Esta parcela todavía no se sincronizó. Espera a tener conexión.');
    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${id}`, { method: 'DELETE' });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'parcela', method: 'DELETE', path: `/parcelas/${id}`,
        label: `Eliminar parcela #${id}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar parcela');
    // Sin esto, esta parcela reaparecería en cualquier lectura offline
    // posterior (getAll() cae a getCached(), que seguiría teniéndola)
    // hasta el próximo login/resetAndPull.
    await SyncEngine.removeCachedEntity('parcelas', id);
  },
};
