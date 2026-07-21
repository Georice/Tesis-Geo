import { CicloActividad } from '../entities/CicloActividad';
import { TipoCiclo } from '../types/CicloTypes';

export interface CrearCicloComando {
  parcelaId:        number;
  tipo:             TipoCiclo;
  fechaInicio:      Date;
  variedadSemilla?: string;
  areaSembrada?:    number;
  observaciones?:   string;
}

export interface FaseInfo {
  codigo:         string;
  nombre:         string;
  ordenFase:      number;
  ordenPlantilla: number;
}

export interface ICicloRepository {
  create(data: CrearCicloComando): Promise<CicloActividad>;
  findActivoByParcela(parcelaId: number): Promise<CicloActividad | null>;
  findByParcela(parcelaId: number): Promise<CicloActividad[]>;
  findById(id: number): Promise<CicloActividad | null>;
  finalizar(id: number): Promise<CicloActividad | null>;
  // Fases para las que el tipo de actividad aplica a TODO el ciclo (p. ej. riego).
  getTodasLasFases(tipoCiclo: TipoCiclo): Promise<FaseInfo[]>;
  // Fases filtradas según dónde tiene sentido un tipo de actividad concreto.
  getFasesPorTipoActividad(tipoCiclo: TipoCiclo, tipoActividad: string): Promise<FaseInfo[]>;
}
