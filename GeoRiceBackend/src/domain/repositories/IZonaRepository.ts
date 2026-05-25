import { Zona } from '../entities/Zona';

export interface IZonaRepository {
  findAll(): Promise<Zona[]>;
  findById(id: number): Promise<Zona | null>;
  create(data: Partial<Zona>): Promise<Zona>;
  update(id: number, data: Partial<Zona>): Promise<Zona | null>;
  delete(id: number): Promise<boolean>;
 assignParcelasInsideZona(zonaId: number): Promise<number>;
}