import { Zona } from '../../../domain/entities/Zona';

export interface CreateZonaDto {
  nombre:       string;
  descripcion?: string;
  geometria?:   object;
}

export interface UpdateZonaDto {
  nombre?:      string;
  descripcion?: string;
  geometria?:   object;
}

export interface ZonaResponseDto {
  id:                 number;
  usuarioId:          string;
  nombre:             string;
  descripcion:        string | null;
  geometria:          object | null;
  fechaCreacion:      Date;
  updatedAt:          Date;
  parcelasAsignadas?: number;
}

export function toZonaResponseDto(zona: Zona, parcelasAsignadas?: number): ZonaResponseDto {
  return {
    id:            zona.id,
    usuarioId:     zona.usuarioId,
    nombre:        zona.nombre,
    descripcion:   zona.descripcion,
    geometria:     zona.geometria,
    fechaCreacion: zona.fechaCreacion,
    updatedAt:     zona.updatedAt,
    ...(parcelasAsignadas !== undefined && { parcelasAsignadas }),
  };
}
