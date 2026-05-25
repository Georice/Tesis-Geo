export interface Parcela {
  p_id: number;
  p_nombre: string;
  p_propietario: string;
  p_cultivo: string;
  p_estado: string;
  p_area_ha: number;
  p_zona_id: number | null;
  p_fecha_creacion: string;
  p_geometria: string | object;
}

export interface CreateParcelaDTO {
  nombre: string;
  propietario: string;
  cultivo: string;
  estado: string;
  zonaId?: number | null;
  geometria: object;
}

export interface UpdateParcelaDTO {
  nombre?: string;
  propietario?: string;
  cultivo?: string;
  estado?: string;
  zonaId?: number | null;
}