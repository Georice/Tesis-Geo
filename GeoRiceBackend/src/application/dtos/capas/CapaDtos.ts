import { CapaParcela } from '../../../domain/entities/CapaParcela';
import { TipoCapa } from '../../../domain/types/CapaTypes';

export interface CreateCapaDto {
  parcelaId:     number;
  tipo:          TipoCapa;
  geometria:     object;
  ndviEstimado?: number;
}

export interface CapaResponseDto {
  id:                 number;
  parcelaId:          number;
  tipo:               TipoCapa;
  geometria:          object;
  ndviEstimado:       number | null;
  fechaActualizacion: Date;
  updatedAt:          Date;
}

export function toCapaResponseDto(capa: CapaParcela): CapaResponseDto {
  return {
    id:                 capa.id,
    parcelaId:          capa.parcelaId,
    tipo:               capa.tipo,
    geometria:          capa.geometria,
    ndviEstimado:       capa.ndviEstimado,
    fechaActualizacion: capa.fechaActualizacion,
    updatedAt:          capa.updatedAt,
  };
}
