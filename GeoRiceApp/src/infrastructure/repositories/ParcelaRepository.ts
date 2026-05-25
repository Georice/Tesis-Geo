import { Parcela, CreateParcelaDTO, UpdateParcelaDTO } from '../../domain/entities/Parcela';
import { apiFetch } from './ApiClient';

export const ParcelaRepository = {

  getAll: async (): Promise<Parcela[]> => {
    const res = await apiFetch('/parcelas');
    return res.json();
  },

  create: async (data: CreateParcelaDTO): Promise<Parcela> => {
    const res = await apiFetch('/parcelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear parcela');
    return json;
  },

  update: async (id: number, data: UpdateParcelaDTO): Promise<Parcela> => {
    const res = await apiFetch(`/parcelas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar parcela');
    return json;
  },

  updateGeometry: async (id: number, geometria: object): Promise<Parcela> => {
    const res = await apiFetch(`/parcelas/${id}/geometry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geometria }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar geometría');
    return json;
  },

  delete: async (id: number): Promise<void> => {
    const res = await apiFetch(`/parcelas/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar parcela');
  },
};