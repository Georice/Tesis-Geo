import { ActividadParcela } from '../entities/ActividadParcela';
import { ProductoActividad } from '../entities/ProductoActividad';

export interface IActividadParcelaRepository {
  findByParcela(parcelaId: number): Promise<ActividadParcela[]>;
  findByCapa(capaId: number): Promise<ActividadParcela[]>;
  findById(id: number): Promise<ActividadParcela | null>;
  create(data: Partial<ActividadParcela>, productos?: Partial<ProductoActividad>[]): Promise<ActividadParcela>;
  update(id: number, data: Partial<ActividadParcela>, productos?: Partial<ProductoActividad>[]): Promise<ActividadParcela | null>;
  delete(id: number): Promise<boolean>;
  findByCiclo(cicloId: number): Promise<ActividadParcela[]>;
}