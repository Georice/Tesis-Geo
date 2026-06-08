import { AuthContext } from '../../shared/types/AuthContext';

export interface IZonaRepository {
  findAll(ctx: AuthContext): Promise<any[]>;
  findById(id: number): Promise<any | null>;
  create(data: any, ctx: AuthContext): Promise<any>;
  update(id: number, data: any, ctx: AuthContext): Promise<any | null>;
  delete(id: number, ctx: AuthContext): Promise<boolean>;
  assignParcelasInsideZona(zonaId: number): Promise<number>;
}
