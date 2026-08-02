import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import { ActividadComando, ProductoComando } from '../../../domain/repositories/IActividadParcelaRepository';

export interface CreateActividadDto extends ActividadComando {
  productos?: ProductoComando[];
}

export interface UpdateActividadDto extends Partial<ActividadComando> {
  productos?: ProductoComando[];
}

// La entidad de dominio ya es un objeto de solo lectura con forma estable;
// se expone tal cual como respuesta (no filtra tecnología, solo datos).
export type ActividadResponseDto = ActividadParcela;

export function toActividadResponseDto(actividad: ActividadParcela): ActividadResponseDto {
  return actividad;
}
