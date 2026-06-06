export type TipoActividad =
  | 'preparacion_suelo' | 'inundacion' | 'siembra_boleo' | 'siembra_trasplante'
  | 'riego' | 'fertilizacion' | 'fumigacion' | 'deshierba' | 'cosecha'
  | 'rozar_quemar' | 'soca_riego' | 'soca_fertilizacion' | 'soca_fumigacion'
  | 'cosecha_soca' | 'observacion';

export type TipoProducto =
  | 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante'
  | 'abono' | 'corrector' | 'bioestimulante' | 'otro';

export interface ProductoActividad {
  id?: number;
  actividadId?: number;
  nombre: string;
  tipo: TipoProducto;
  dosis?: number | null;
  unidad?: string | null;
  dosisPorTanque?: number | null;
}

export interface Actividad {
  id: number;
  parcelaId: number;
  capaId?: number | null;
  cicloId?: number | null;
  tipo: TipoActividad;
  fecha: string;
  // Estado
  estado?: 'pendiente' | 'en_proceso' | 'completada';
  fechaInicio?: string | null;
  fechaFin?: string | null;
  // General
  insumo?: string | null;
  cantidad?: number | null;
  unidad?: string | null;
  metodo?: string | null;
  // Riego
  laminaAgua?: number | null;
  // Cosecha
  rendimientoHa?: number | null;
  totalSacos?: number | null;
  humedad?: number | null;
  precioQq?: number | null;
  ingresoTotal?: number | null;
  costoCosecha?: number | null;
  destino?: string | null;
  // Plagas
  plagaDetectada?: string | null;
  nivelDano?: string | null;
  nivelAlerta?: string | null;
  // Tanques
  capacidadTanque?: number | null;
  numTanques?: number | null;
  // Jornales
  numJornales?: number | null;
  pagoJornal?: number | null;
  costoManoObra?: number | null;
  // Maquinaria
  tipoMaquinaria?: string | null;
  unidadCobro?: 'hora' | 'hectarea' | 'saco' | 'otro' | null;
  cantidadUnidades?: number | null;
  costoPorUnidad?: number | null;
  costoMaquinaria?: number | null;
  // Otros
  observaciones?: string | null;
  fechaRegistro?: string;
  productos?: ProductoActividad[];
}


export interface UpdateActividadDTO {
  tipo?: string;
  estado?: 'pendiente' | 'en_proceso' | 'completada';
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
  metodo?: string;
  insumo?: string;
  cantidad?: number;
  unidad?: string;
  laminaAgua?: number;
  rendimientoHa?: number;
  totalSacos?: number;
  humedad?: number;
  precioQq?: number;
  costoCosecha?: number;
  destino?: string;
  plagaDetectada?: string;
  nivelDano?: string;
  nivelAlerta?: string;
  observaciones?: string;
  capacidadTanque?: number;
  numTanques?: number;
  numJornales?: number;
  pagoJornal?: number;
  costoManoObra?: number;
  tipoMaquinaria?: string;
  unidadCobro?: string;
  cantidadUnidades?: number;
  costoPorUnidad?: number;
  costoMaquinaria?: number;
  productos?: any[];
}

export interface CreateActividadDTO extends UpdateActividadDTO {
  parcelaId?: number;
  cicloId?: number;
  capaId?: number;
}