import { Parcela, CreateParcelaDTO, UpdateParcelaDTO } from '../../domain/entities/Parcela';
import { apiFetch } from './ApiClient';

export const ParcelaRepository = {

  getAll: async (): Promise<Parcela[]> => {
    const res = await apiFetch('/parcelas');
    if (!res.ok) throw new Error(`GET /parcelas falló: ${res.status}`);
    const data: any[] = await res.json();
    return data.map(item => ({
      p_id:             item.id            ?? item.p_id,
      p_nombre:         item.nombre        ?? item.p_nombre,
      p_propietario:    item.propietario_nombre ?? item.propietario ?? item.p_propietario,
      p_cultivo:        item.cultivo       ?? item.p_cultivo,
      p_estado:         item.estado        ?? item.p_estado,
      p_area_ha:        item.areaHa        ?? item.area_ha        ?? item.p_area_ha,
      p_zona_id:        item.zonaId        ?? item.zona_id        ?? item.p_zona_id,
      p_fecha_creacion: item.fechaCreacion ?? item.fecha_creacion ?? item.p_fecha_creacion,
      p_geometria:      item.geometria     ?? item.p_geometria,
    }));
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