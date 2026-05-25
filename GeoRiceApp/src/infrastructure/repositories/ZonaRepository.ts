import { Zona, CreateZonaDTO, UpdateZonaDTO } from '../../domain/entities/Zona';
import { apiFetch } from './ApiClient';

export const ZonaRepository = {

  getAll: async (): Promise<Zona[]> => {
    const res = await apiFetch('/zonas');
    return res.json();
  },

  create: async (data: CreateZonaDTO): Promise<Zona> => {
    const res = await apiFetch('/zonas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear zona');
    return json;
  },

  update: async (id: number, data: UpdateZonaDTO): Promise<Zona> => {
    const res = await apiFetch(`/zonas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar zona');
    return json;
  },

  delete: async (id: number): Promise<void> => {
    const res = await apiFetch(`/zonas/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar zona');
  },
};