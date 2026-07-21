import { CicloActividad } from '../entities/CicloActividad';

export interface ICicloRepository {
  findActivoByParcela(parcelaId: number): Promise<CicloActividad | null>;
  findByParcela(parcelaId: number): Promise<CicloActividad[]>;
  findById(id: number): Promise<CicloActividad | null>;
  create(data: Partial<CicloActividad>): Promise<CicloActividad>;
  finalizar(id: number): Promise<CicloActividad | null>;
}
