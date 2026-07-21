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
  // true solo en zonas creadas offline que todavía no llegaron al
  // servidor (id temporal negativo). Nunca lo manda el backend.
  pendingSync?: boolean;
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