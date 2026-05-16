import { ActividadParcela } from '../entities/ActividadParcela';

export interface IActividadParcelaRepository {
  findByParcela(parcelaId: number): Promise<ActividadParcela[]>;
  findByCapa(capaId: number): Promise<ActividadParcela[]>;
  findById(id: number): Promise<ActividadParcela | null>;
  create(data: Partial<ActividadParcela>): Promise<ActividadParcela>;
  update(id: number, data: Partial<ActividadParcela>): Promise<ActividadParcela | null>;
  delete(id: number): Promise<boolean>;
}