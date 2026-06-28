import { ActividadParcela } from '../entities/ActividadParcela';
import { ProductoActividad } from '../entities/ProductoActividad';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DetallesActividad {
  detalleRiego?: { laminaAgua?: number };
  detalleFumigacion?: { plagaDetectada?: string; nivelDano?: string; capacidadTanque?: number; numTanques?: number };
  detalleFertilizacion?: Record<string, never>;
  detalleCosecha?: { rendimientoHa?: number; totalSacos?: number; humedad?: number; precioQq?: number; ingresoTotal?: number; costoCosecha?: number; destino?: string };
  detalleManoObra?: { numJornales?: number; pagoJornal?: number; unidadManoObra?: string; cantidadUnidadMo?: number; precioUnidadMo?: number; numTrabajadores?: number; numTareas?: number; precioTarea?: number; costoSembradores?: number; costoManoObra?: number; descripcionUnidadMo?: string };
  detalleMaquinaria?: { tipoMaquinaria?: string; unidadCobro?: string; cantidadUnidades?: number; costoPorUnidad?: number; costoMaquinaria?: number };
}

type ActividadBase = Omit<Partial<ActividadParcela>, 'detalleRiego' | 'detalleFumigacion' | 'detalleFertilizacion' | 'detalleCosecha' | 'detalleManoObra' | 'detalleMaquinaria'>;

export type CreateActividadData = ActividadBase & DetallesActividad;

export interface IActividadParcelaRepository {
  findByParcela(parcelaId: number, page?: number, pageSize?: number): Promise<PaginatedResult<ActividadParcela>>;
  findByCapa(capaId: number): Promise<ActividadParcela[]>;
  findByCiclo(cicloId: number): Promise<ActividadParcela[]>;
  findById(id: number): Promise<ActividadParcela | null>;
  create(data: CreateActividadData, productos?: Partial<ProductoActividad>[]): Promise<ActividadParcela>;
  update(id: number, data: CreateActividadData, productos?: Partial<ProductoActividad>[]): Promise<ActividadParcela | null>;
  delete(id: number): Promise<boolean>;
}