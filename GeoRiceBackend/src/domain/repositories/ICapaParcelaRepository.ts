import { CapaParcela } from '../entities/CapaParcela';

export interface ICapaParcelaRepository {
  findByParcela(parcelaId: number): Promise<CapaParcela[]>;
  findById(id: number): Promise<CapaParcela | null>;
  create(data: Partial<CapaParcela>): Promise<CapaParcela>;
  update(id: number, data: Partial<CapaParcela>): Promise<CapaParcela | null>;
  updateNdvi(id: number, ndviEstimado: number): Promise<CapaParcela | null>;
  delete(id: number): Promise<boolean>;
  isInsideParcela(parcelaId: number, geometria: object): Promise<boolean>;
}