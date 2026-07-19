import { ActividadParcela } from '../entities/ActividadParcela';
import { TipoActividad, NivelAlerta, EstadoActividad } from '../types/ActividadTypes';
import { NivelDano, DestinoCosecha, UnidadManoObra, UnidadCobroMaquinaria } from '../types/DetalleTypes';
import { TipoProducto } from '../types/ProductoTypes';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductoComando {
  id?:                 number;
  nombre:              string;
  tipo?:               TipoProducto;
  dosis?:              number;
  unidad?:             string;
  dosisPorTanque?:     number;
  dosisHa?:            number;
  dosisPorUnidadMo?:   number;
  dosisTotal?:         number;
  presentacionMl?:     number;
  precioPresentacion?: number;
  frascoUsados?:       number;
  precioUnitario?:     number;
  costoTotal?:         number;
}

// Los campos aceptan `null` además de `undefined` porque, al recalcular en
// UpdateActividad, se combinan con el detalle ya persistido (que sí puede
// tener columnas nulas en BD) mediante spread.
export interface DetalleRiegoComando        { laminaAgua?: number | null; }
export interface DetalleFumigacionComando   { plagaDetectada?: string | null; nivelDano?: NivelDano | null; capacidadTanque?: number | null; numTanques?: number | null; }
export interface DetalleFertilizacionComando { }
export interface DetalleCosechaComando      { rendimientoHa?: number | null; totalSacos?: number | null; humedad?: number | null; precioQq?: number | null; ingresoTotal?: number | null; costoCosecha?: number | null; destino?: DestinoCosecha | null; }
export interface DetalleManoObraComando     { numJornales?: number | null; pagoJornal?: number | null; costoManoObra?: number | null; unidadManoObra?: UnidadManoObra | null; cantidadUnidadMo?: number | null; precioUnidadMo?: number | null; numTrabajadores?: number | null; pagoPorTrabajador?: number | null; descripcionUnidadMo?: string | null; numTareas?: number | null; precioTarea?: number | null; costoSembradores?: number | null; }
export interface DetalleMaquinariaComando   { tipoMaquinaria?: string | null; unidadCobro?: UnidadCobroMaquinaria | null; cantidadUnidades?: number | null; costoPorUnidad?: number | null; costoMaquinaria?: number | null; }

export interface ActividadComando {
  parcelaId:             number;
  capaId?:                number;
  tipo:                   TipoActividad;
  fecha?:                 Date;
  fechaInicio?:           Date;
  fechaFin?:              Date;
  metodo?:                string;
  insumo?:                string;
  cantidad?:              number;
  unidad?:                string;
  nivelAlerta?:           NivelAlerta;
  observaciones?:         string;
  cicloId?:               number;
  ordenPlantilla?:        number;
  faseId?:                number;
  estado?:                EstadoActividad;
  createdBy?:             string;
  updatedBy?:             string;
  numeroActividad?:       number;
  costoInsumos?:          number;
  costoTotalActividad?:   number;
  detalleRiego?:          DetalleRiegoComando;
  detalleFumigacion?:     DetalleFumigacionComando;
  detalleFertilizacion?:  DetalleFertilizacionComando;
  detalleCosecha?:        DetalleCosechaComando;
  detalleManoObra?:       DetalleManoObraComando;
  detalleMaquinaria?:     DetalleMaquinariaComando;
}

export interface IActividadParcelaRepository {
  findByParcela(parcelaId: number, page?: number, pageSize?: number): Promise<PaginatedResult<ActividadParcela>>;
  findByCapa(capaId: number): Promise<ActividadParcela[]>;
  findByCiclo(cicloId: number): Promise<ActividadParcela[]>;
  findById(id: number): Promise<ActividadParcela | null>;
  create(data: ActividadComando, productos?: ProductoComando[]): Promise<ActividadParcela>;
  update(id: number, data: Partial<ActividadComando>, productos?: ProductoComando[]): Promise<ActividadParcela | null>;
  delete(id: number): Promise<boolean>;
}
