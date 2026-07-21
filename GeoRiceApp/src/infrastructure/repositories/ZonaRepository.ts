import { Zona, CreateZonaDTO, UpdateZonaDTO } from '../../domain/entities/Zona';
import { apiFetch } from './ApiClient';
import { SyncEngine } from '../sync/SyncEngine';

export const ZonaRepository = {

  getAll: async (): Promise<Zona[]> => {
    let base: Zona[];
    try {
      const res = await apiFetch('/zonas');
      if (!res.ok) throw new Error(`GET /zonas falló: ${res.status}`);
      base = await res.json();
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      const cached = await SyncEngine.getCached();
      base = cached.zonas;
    }
    // Las zonas creadas offline se muestran de inmediato (id temporal), sin
    // importar si la lectura de arriba vino de la red o de la caché.
    const pendientes = await SyncEngine.getLocalRecords('zona');
    return [...pendientes.map(r => r.data as Zona), ...base];
  },

  create: async (data: CreateZonaDTO): Promise<Zona> => {
    let res: Response;
    try {
      res = await apiFetch('/zonas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;

      const tempId = SyncEngine.nextTempId();
      const opId = await SyncEngine.enqueue({
        entity: 'zona', method: 'POST', path: '/zonas', body: data,
        label: `Nueva zona: ${data.nombre}`,
      });
      const local: Zona & { parcelasAsignadas: number } = {
        id:            tempId,
        nombre:        data.nombre,
        descripcion:   data.descripcion ?? '',
        geometria:     data.geometria ?? null,
        fechaCreacion: new Date().toISOString(),
        pendingSync:   true,
        parcelasAsignadas: 0,
      };
      await SyncEngine.addLocalRecord('zona', tempId, local, opId);
      return local;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear zona');
    return json;
  },

  update: async (id: number, data: UpdateZonaDTO): Promise<Zona> => {
    if (id < 0) throw new Error('Esta zona todavía no se sincronizó. Espera a tener conexión.');
    let res: Response;
    try {
      res = await apiFetch(`/zonas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'zona', method: 'PUT', path: `/zonas/${id}`, body: data,
        label: `Editar zona #${id}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar zona');
    return json;
  },

  delete: async (id: number): Promise<void> => {
    if (id < 0) throw new Error('Esta zona todavía no se sincronizó. Espera a tener conexión.');
    let res: Response;
    try {
      res = await apiFetch(`/zonas/${id}`, { method: 'DELETE' });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'zona', method: 'DELETE', path: `/zonas/${id}`,
        label: `Eliminar zona #${id}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar zona');
  },
};
