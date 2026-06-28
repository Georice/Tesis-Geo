import { Actividad, CreateActividadDTO, UpdateActividadDTO } from '../../domain/entities/Actividad';
import { apiFetch } from './ApiClient';

interface PaginatedActividades {
  data: Actividad[];
  total: number;
  page: number;
  pageSize: number;
}

export const ActividadRepository = {

  getByParcela: async (parcelaId: number, page?: number, pageSize?: number): Promise<Actividad[]> => {
    const query = page ? `?page=${page}&pageSize=${pageSize ?? 20}` : '';
    const res = await apiFetch(`/parcelas/${parcelaId}/actividades${query}`);
    if (!res.ok) throw new Error('Error al obtener actividades');
    const json: PaginatedActividades = await res.json();
    return json.data ?? [];
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

  update: async (parcelaId: number, id: number, data: UpdateActividadDTO): Promise<Actividad> => {
    const res = await apiFetch(`/parcelas/${parcelaId}/actividades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar actividad');
    return json;
  },

  delete: async (parcelaId: number, id: number): Promise<void> => {
    const res = await apiFetch(`/parcelas/${parcelaId}/actividades/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al eliminar actividad');
  },
};