import { CapaParcela } from '../entities/CapaParcela';
import { TipoCapa } from '../types/CapaTypes';

export interface CrearCapaComando {
  parcelaId:     number;
  tipo:          TipoCapa;
  geometria:     object;
  ndviEstimado?: number;
  createdBy?:    string;
  updatedBy?:    string;
}

export interface ActualizarCapaComando {
  tipo?:         TipoCapa;
  geometria?:    object;
  ndviEstimado?: number;
}

export interface ICapaParcelaRepository {
  findByParcela(parcelaId: number): Promise<CapaParcela[]>;
  findById(id: number): Promise<CapaParcela | null>;
  create(data: CrearCapaComando): Promise<CapaParcela>;
  update(id: number, data: ActualizarCapaComando): Promise<CapaParcela | null>;
  updateNdvi(id: number, ndviEstimado: number): Promise<CapaParcela | null>;
  updateGeometry(id: number, parcelaId: number, geometria: object): Promise<CapaParcela | null>;
  delete(id: number): Promise<boolean>;
  isInsideParcela(parcelaId: number, geometria: object): Promise<boolean>;
}
