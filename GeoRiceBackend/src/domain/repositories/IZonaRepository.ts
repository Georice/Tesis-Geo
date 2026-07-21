import { AuthContext } from '../../shared/types/AuthContext';
import { Zona } from '../entities/Zona';

export interface CrearZonaComando {
  nombre:       string;
  descripcion?: string | null;
  geometria?:   object;
}

export interface ActualizarZonaComando {
  nombre?:      string;
  descripcion?: string | null;
  geometria?:   object;
}

export interface IZonaRepository {
  findAll(ctx: AuthContext): Promise<Zona[]>;
  findById(id: number): Promise<Zona | null>;
  create(data: CrearZonaComando, ctx: AuthContext): Promise<Zona>;
  update(id: number, data: ActualizarZonaComando, ctx: AuthContext): Promise<Zona | null>;
  delete(id: number, ctx: AuthContext): Promise<boolean>;
  assignParcelasInsideZona(zonaId: number): Promise<number>;
  countParcelasAsignadas(zonaId: number): Promise<number>;
  hasOverlap(geometria: object, excludeId?: number): Promise<boolean>;
}
