import { Actividad, CreateActividadDTO, UpdateActividadDTO } from '../../domain/entities/Actividad';
import { apiFetch } from './ApiClient';

export const ActividadRepository = {

  getByParcela: async (parcelaId: number): Promise<Actividad[]> => {
    const res = await apiFetch(`/parcelas/${parcelaId}/actividades`);
    if (!res.ok) throw new Error('Error al obtener actividades');
    return res.json();
  },

  create: async (parcelaId: number, data: CreateActividadDTO): Promise<Actividad> => {
    const res = await apiFetch(`/parcelas/${parcelaId}/actividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear actividad');
    return json;
  },

  update: async (id: number, data: UpdateActividadDTO): Promise<Actividad> => {
    const res = await apiFetch(`/actividades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar actividad');
    return json;
  },

  delete: async (id: number): Promise<void> => {
    const res = await apiFetch(`/actividades/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar actividad');
  },
};