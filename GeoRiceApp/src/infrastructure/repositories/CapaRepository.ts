import { Capa, CreateCapaDTO } from '../../domain/entities/Capa';
import { apiFetch } from './ApiClient';

export const CapaRepository = {

  getByParcela: async (parcelaId: number): Promise<Capa[]> => {
    const res = await apiFetch(`/parcelas/${parcelaId}/capas`);
    if (!res.ok) throw new Error('Error al obtener capas');
    return res.json();
  },

  create: async (parcelaId: number, data: CreateCapaDTO): Promise<Capa> => {
    const res = await apiFetch(`/parcelas/${parcelaId}/capas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear capa');
    return json;
  },

  updateNdvi: async (capaId: number, ndviEstimado: number): Promise<Capa> => {
    const res = await apiFetch(`/capas/${capaId}/ndvi`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ndviEstimado }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar NDVI');
    return json;
  },

  delete: async (id: number): Promise<void> => {
    const res = await apiFetch(`/capas/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar capa');
  },
};