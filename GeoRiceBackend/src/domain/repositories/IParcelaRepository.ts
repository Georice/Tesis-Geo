// import { Parcela } from '../entities/Parcela';

// export interface IParcelaRepository {
//   findAll(): Promise<Parcela[]>;
//   findById(id: number): Promise<Parcela | null>;
//   create(data: Partial<Parcela>): Promise<Parcela>;
//   update(id: number, data: Partial<Parcela>): Promise<Parcela | null>;
//   updateGeometry(id: number, geometria: object): Promise<Parcela | null>;
//   delete(id: number): Promise<boolean>;

//   calculateArea(geometria: object): Promise<number>;
//   hasOverlap(geometria: object, excludeId?: number): Promise<boolean>;
// }

// import { Parcela } from '../entities/Parcela';

// export interface IParcelaRepository {
//   findAll(): Promise<Parcela[]>;
//   findById(id: number): Promise<Parcela | null>;
//   findByZona(zonaId: number): Promise<Parcela[]>;
//   create(data: Partial<Parcela>): Promise<Parcela>;
//   update(id: number, data: Partial<Parcela>): Promise<Parcela | null>;
//   updateGeometry(id: number, geometria: object): Promise<Parcela | null>;
//   updateEstado(id: number, estado: string): Promise<Parcela | null>;
//   delete(id: number): Promise<boolean>;
//   calculateArea(geometria: object): Promise<number>;
//   hasOverlap(geometria: object, excludeId?: number): Promise<boolean>;
// }

import { Parcela } from '../entities/Parcela';

export interface IParcelaRepository {
  findAll(): Promise<Parcela[]>;
  findById(id: number): Promise<Parcela | null>;
  findByZona(zonaId: number): Promise<Parcela[]>;
  create(data: Partial<Parcela>): Promise<Parcela>;
  update(id: number, data: Partial<Parcela>): Promise<Parcela | null>;
  updateGeometry(id: number, geometria: object): Promise<Parcela | null>;
  updateEstado(id: number, estado: string): Promise<Parcela | null>;
  delete(id: number): Promise<boolean>;
  calculateArea(geometria: object): Promise<number>;
  hasOverlap(geometria: object, excludeId?: number): Promise<boolean>;
}