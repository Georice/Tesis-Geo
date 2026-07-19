import { Capa, CreateCapaDTO } from '../../domain/entities/Capa';
import { apiFetch } from './ApiClient';
import { SyncEngine } from '../sync/SyncEngine';

export const CapaRepository = {
  getByParcela: async (parcelaId: number): Promise<Capa[]> => {
    // Una parcela recién creada offline (id temporal) todavía no existe en
    // el servidor — no tiene sentido intentar la red (fallaría con un
    // 404 confuso) ni tampoco puede tener capas guardadas todavía.
    if (parcelaId < 0) return [];

    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${parcelaId}/capas`);
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      const cached = await SyncEngine.getCached();
      return cached.capas.filter((c: any) => (c.parcelaId ?? c.parcela_id) === parcelaId);
    }
    if (!res.ok) throw new Error('Error al obtener capas');
    return res.json();
  },

  create: async (parcelaId: number, data: CreateCapaDTO): Promise<Capa> => {
    if (parcelaId < 0) {
      throw new Error('Esta parcela todavía no se sincronizó. Espera a tener conexión para agregar capas.');
    }

    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${parcelaId}/capas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'capa', method: 'POST', path: `/parcelas/${parcelaId}/capas`, body: data,
        label: `Nueva capa (parcela #${parcelaId})`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear capa');
    return json;
  },

  updateNdvi: async (capaId: number, ndviEstimado: number): Promise<Capa> => {
    if (capaId < 0) throw new Error('Esta capa todavía no se sincronizó. Espera a tener conexión.');
    let res: Response;
    try {
      res = await apiFetch(`/capas/${capaId}/ndvi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ndviEstimado }),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'capa', method: 'PUT', path: `/capas/${capaId}/ndvi`, body: { ndviEstimado },
        label: `Editar NDVI capa #${capaId}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar NDVI');
    return json;
  },

  updateGeometry: async (parcelaId: number, capaId: number, data: { tipo?: string; geometria?: object }): Promise<Capa> => {
    if (capaId < 0) throw new Error('Esta capa todavía no se sincronizó. Espera a tener conexión.');
    let res: Response;
    try {
      res = await apiFetch(`/parcelas/${parcelaId}/capas/${capaId}/geometry`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'capa', method: 'PUT', path: `/parcelas/${parcelaId}/capas/${capaId}/geometry`, body: data,
        label: `Editar geometría capa #${capaId}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar capa');
    return json;
  },

  delete: async (id: number): Promise<void> => {
    if (id < 0) throw new Error('Esta capa todavía no se sincronizó. Espera a tener conexión.');
    let res: Response;
    try {
      res = await apiFetch(`/capas/${id}`, { method: 'DELETE' });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      await SyncEngine.enqueue({
        entity: 'capa', method: 'DELETE', path: `/capas/${id}`,
        label: `Eliminar capa #${id}`,
      });
      throw new SyncEngine.OfflineQueuedError();
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar capa');
  },
};
