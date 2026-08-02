import { AuthContext } from '../../shared/types/AuthContext';
import { Parcela } from '../entities/Parcela';
import { EstadoParcela, CicloActualParcela } from '../types/ParcelaTypes';

export interface CrearParcelaComando {
  nombre:      string;
  cultivo?:    string;
  estado?:     EstadoParcela;
  geometria:   object;
  usuarioId?:  string; // solo admin puede asignar un propietario distinto de sí mismo
}

export interface ActualizarParcelaComando {
  nombre?:      string;
  cultivo?:     string;
  estado?:      EstadoParcela;
  cicloActual?: CicloActualParcela;
  usuarioId?:   string; // solo admin puede reasignar propietario
}

export interface IParcelaRepository {
  findAll(ctx: AuthContext): Promise<Parcela[]>;
  findById(id: number, ctx: AuthContext): Promise<Parcela | null>;
  findByZona(zonaId: number, ctx: AuthContext): Promise<Parcela[]>;
  create(data: CrearParcelaComando, ctx: AuthContext): Promise<Parcela>;
  update(id: number, data: ActualizarParcelaComando, ctx: AuthContext): Promise<Parcela | null>;
  updateGeometry(id: number, geometria: object, ctx: AuthContext): Promise<Parcela | null>;
  updateEstado(id: number, estado: EstadoParcela, ctx: AuthContext): Promise<Parcela | null>;
  delete(id: number, ctx: AuthContext): Promise<boolean>;
  calculateArea(geometria: object): Promise<number>;
  hasOverlap(geometria: object, excludeId?: number): Promise<boolean>;
  // Lookup interno sin filtro de propiedad, usado por otros agregados
  // (p. ej. actividades) que ya verificaron el acceso a la parcela antes.
  findAreaHa(id: number): Promise<number | null>;
}
