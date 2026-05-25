export interface Zona {
  id?: number;
  z_id?: number;
  nombre?: string;
  z_nombre?: string;
  descripcion?: string;
  z_descripcion?: string;
  geometria?: object | null;
  z_geometria?: string | null;
  fechaCreacion?: string;
  z_fecha_creacion?: string;
}

export interface CreateZonaDTO {
  nombre: string;
  descripcion?: string;
  geometria?: object | null;
}

export interface UpdateZonaDTO {
  nombre?: string;
  descripcion?: string;
  geometria?: object | null;
}