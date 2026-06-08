import { AuthContext } from '../../shared/types/AuthContext';

export interface IParcelaRepository {
  findAll(ctx: AuthContext): Promise<any[]>;
  findById(id: number, ctx: AuthContext): Promise<any | null>;
  findByZona(zonaId: number, ctx: AuthContext): Promise<any[]>;
  create(data: any, ctx: AuthContext): Promise<any>;
  update(id: number, data: any, ctx: AuthContext): Promise<any | null>;
  updateGeometry(id: number, geometria: object, ctx: AuthContext): Promise<any | null>;
  updateEstado(id: number, estado: string, ctx: AuthContext): Promise<any | null>;
  delete(id: number, ctx: AuthContext): Promise<boolean>;
  calculateArea(geometria: object): Promise<number>;
  hasOverlap(geometria: object, excludeId?: number): Promise<boolean>;
}
