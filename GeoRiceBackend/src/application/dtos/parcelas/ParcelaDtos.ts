import { Parcela } from '../../../domain/entities/Parcela';
import { EstadoParcela, CicloActualParcela } from '../../../domain/types/ParcelaTypes';

export interface CreateParcelaDto {
  nombre:     string;
  cultivo?:   string;
  estado?:    EstadoParcela;
  geometria:  object;
  usuarioId?: string;
}

export interface UpdateParcelaDto {
  nombre?:      string;
  cultivo?:     string;
  estado?:      EstadoParcela;
  cicloActual?: CicloActualParcela;
  usuarioId?:   string;
}

export interface ParcelaResponseDto {
  id:            number;
  usuarioId:     string;
  zonaId:        number | null;
  nombre:        string;
  propietario:   string | null;
  cultivo:       string;
  geometria:     object;
  estado:        EstadoParcela;
  cicloActual:   CicloActualParcela | null;
  areaHa:        number;
  areaCuadras:   number;
  fechaCreacion: Date;
  updatedAt:     Date;
}

export function toParcelaResponseDto(parcela: Parcela): ParcelaResponseDto {
  return {
    id:            parcela.id,
    usuarioId:     parcela.usuarioId,
    zonaId:        parcela.zonaId,
    nombre:        parcela.nombre,
    propietario:   parcela.propietario,
    cultivo:       parcela.cultivo,
    geometria:     parcela.geometria,
    estado:        parcela.estado,
    cicloActual:   parcela.cicloActual,
    areaHa:        parcela.areaHa,
    areaCuadras:   parcela.areaCuadras,
    fechaCreacion: parcela.fechaCreacion,
    updatedAt:     parcela.updatedAt,
  };
}
