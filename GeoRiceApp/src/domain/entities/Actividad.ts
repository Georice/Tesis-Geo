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
  fechaRegistro?: string;
}

export interface Actividad {
  id: number;
  parcelaId: number;
  capaId?: number | null;
  tipo: TipoActividad;
  fecha: string;
  // Siembra
  insumo?: string | null;
  cantidad?: number | null;
  unidad?: string | null;
  // Método
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
  // Observación
  nivelAlerta?: string | null;
  observaciones?: string | null;
  fechaRegistro?: string;
  // Productos
  productos?: ProductoActividad[];
}

export interface CreateActividadDTO {
  tipo: TipoActividad;
  fecha: string;
  insumo?: string;
  cantidad?: number;
  unidad?: string;
  metodo?: string;
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
  capaId?: number | null;
  productos?: Partial<ProductoActividad>[];
}

export interface UpdateActividadDTO {
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
  productos?: Partial<ProductoActividad>[];
}