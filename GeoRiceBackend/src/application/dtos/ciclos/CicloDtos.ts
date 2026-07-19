import { CicloActividad } from '../../../domain/entities/CicloActividad';
import { TipoCiclo, EstadoCiclo } from '../../../domain/types/CicloTypes';

export interface IniciarCicloDto {
  tipo:             TipoCiclo;
  fechaInicio:      string;
  variedadSemilla?: string;
  areaSembrada?:    number;
  observaciones?:   string;
}

export interface CicloResponseDto {
  id:              number;
  parcelaId:       number;
  tipo:            TipoCiclo;
  estado:          EstadoCiclo;
  fechaInicio:     Date;
  fechaFin:        Date | null;
  variedadSemilla: string | null;
  areaSembrada:    number | null;
  observaciones:   string | null;
  fechaRegistro:   Date;
  updatedAt:       Date;
}

export function toCicloResponseDto(ciclo: CicloActividad): CicloResponseDto {
  return {
    id:              ciclo.id,
    parcelaId:       ciclo.parcelaId,
    tipo:            ciclo.tipo,
    estado:          ciclo.estado,
    fechaInicio:     ciclo.fechaInicio,
    fechaFin:        ciclo.fechaFin,
    variedadSemilla: ciclo.variedadSemilla,
    areaSembrada:    ciclo.areaSembrada,
    observaciones:   ciclo.observaciones,
    fechaRegistro:   ciclo.fechaRegistro,
    updatedAt:       ciclo.updatedAt,
  };
}
