export interface Parcela {
  p_id: number;
  p_nombre: string;
  p_propietario: string;
  p_cultivo: string;
  p_estado: string;
  p_area_ha: number;
  p_zona_id: number | null;
  p_fecha_creacion: string;
  p_geometria: string | object;
}

export interface CreateParcelaDTO {
  nombre:       string;
  propietario?: string;
  cultivo:      string;
  estado:       string;
  zonaId?:      number | null;
  geometria:    object;
}

export interface UpdateParcelaDTO {
  nombre?: string;
  propietario?: string;
  cultivo?: string;
  estado?: string;
  zonaId?: number | null;
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

// export interface CreateActividadDTO extends UpdateActividadDTO {
//   parcelaId?: number;
//   cicloId?: number;
//   capaId?: number;
// }