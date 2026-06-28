export type TipoActividad =
  | 'preparacion_suelo' | 'inundacion' | 'siembra_boleo' | 'siembra_trasplante'
  | 'riego' | 'fertilizacion' | 'fumigacion' | 'deshierba' | 'cosecha'
  | 'rozar_quemar' | 'soca_riego' | 'soca_fertilizacion' | 'soca_fumigacion'
  | 'cosecha_soca' | 'observacion';

export type TipoProducto =
  | 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante'
  | 'abono' | 'corrector' | 'bioestimulante' | 'otro';

export type UnidadManoObra = 'jornal' | 'tanque' | 'saco' | 'tarea' | 'otro';

export interface ProductoActividad {
  id?: number;
  actividadId?: number;
  nombre: string;
  tipo: TipoProducto;
  dosis?: number | null;
  unidad?: string | null;
  dosisPorTanque?: number | null;
  dosisHa?: number | null;
  dosisPorUnidadMo?: number | null;
  dosisTotal?: number | null;
  presentacionMl?: number | null;
  precioPresentacion?: number | null;
  frascoUsados?: number | null;
  precioUnitario?: number | null;
  costoTotal?: number | null;
}

// ── NUEVO: Fase (relación con fases_ciclo, viene poblada desde el GET) ──
export interface Fase {
  id: number;
  codigo: string;        // F1...F6
  nombre: string;        // ej: "Preparación de suelo"
  tipoCiclo: string;
  ordenFase: number;
  ordenMin: number;
  ordenMax: number;
  tiposActividad: string[];
  descripcion?: string | null;
}

// ── NUEVO: detalles normalizados (espejo de las tablas hijas del backend) ──
export interface DetalleRiego {
  laminaAgua?: number | null;
}

export interface DetalleFumigacion {
  plagaDetectada?: string | null;
  nivelDano?: string | null;
  capacidadTanque?: number | null;
  numTanques?: number | null;
}

export interface DetalleFertilizacion {
  // reservado para futuras columnas propias de fertilización
}

export interface DetalleCosecha {
  rendimientoHa?: number | null;
  totalSacos?: number | null;
  humedad?: number | null;
  precioQq?: number | null;
  ingresoTotal?: number | null;
  costoCosecha?: number | null;
  destino?: string | null;
}

export interface DetalleManoObra {
  numJornales?: number | null;
  pagoJornal?: number | null;
  costoManoObra?: number | null;
  unidadManoObra?: UnidadManoObra | null;
  cantidadUnidadMo?: number | null;
  precioUnidadMo?: number | null;
  numTrabajadores?: number | null;
  pagoPorTrabajador?: number | null;
  descripcionUnidadMo?: string | null;
  numTareas?: number | null;
  precioTarea?: number | null;
  costoSembradores?: number | null;
}

export interface DetalleMaquinaria {
  tipoMaquinaria?: string | null;
  unidadCobro?: 'hora' | 'hectarea' | 'saco' | 'otro' | null;
  cantidadUnidades?: number | null;
  costoPorUnidad?: number | null;
  costoMaquinaria?: number | null;
}

export interface Actividad {
  id: number;
  parcelaId: number;
  capaId?: number | null;
  cicloId?: number | null;
  numeroActividad?: number | null;
  tipo: TipoActividad;
  fecha: string;
  estado?: 'pendiente' | 'en_proceso' | 'completada';
  fechaInicio?: string | null;
  fechaFin?: string | null;
  // ── Fases ──────────────────────────────────────────────
  ordenPlantilla?: number | null;
  faseId?: number | null;
  // ── General ───────────────────────────────────────────
  insumo?: string | null;
  cantidad?: number | null;
  unidad?: string | null;
  metodo?: string | null;
  nivelAlerta?: string | null;
  observaciones?: string | null;
  fechaRegistro?: string;
  productos?: ProductoActividad[];
  // ── NUEVO: detalles normalizados (lo que llega/se envía ahora) ──
  detalleRiego?: DetalleRiego | null;
  detalleFumigacion?: DetalleFumigacion | null;
  detalleFertilizacion?: DetalleFertilizacion | null;
  detalleCosecha?: DetalleCosecha | null;
  detalleManoObra?: DetalleManoObra | null;
  detalleMaquinaria?: DetalleMaquinaria | null;
  // ── Costos totales (se mantienen en la tabla padre) ────
  costoInsumos?: number | null;
  costoTotalActividad?: number | null;


    // ── Fases ──────────────────────────────────────────────
  // ordenPlantilla?: number | null;
  // faseId?: number | null;
  fase?: Fase | null;

  // ──────────────────────────────────────────────────────
  // LEGACY (propiedades planas viejas) — DEPRECATED.
  // Se mantienen temporalmente solo para no romper código
  // existente que aún las lea directo. El backend YA NO
  // las envía ni las acepta; usar los detalleX de arriba.
  // TODO: eliminar una vez que ActividadesScreen.tsx migre
  // por completo a la estructura anidada.
  // ──────────────────────────────────────────────────────
  /** @deprecated usar detalleRiego.laminaAgua */
  laminaAgua?: number | null;
  /** @deprecated usar detalleCosecha.rendimientoHa */
  rendimientoHa?: number | null;
  /** @deprecated usar detalleCosecha.totalSacos */
  totalSacos?: number | null;
  /** @deprecated usar detalleCosecha.humedad */
  humedad?: number | null;
  /** @deprecated usar detalleCosecha.precioQq */
  precioQq?: number | null;
  /** @deprecated usar detalleCosecha.ingresoTotal */
  ingresoTotal?: number | null;
  /** @deprecated usar detalleCosecha.costoCosecha */
  costoCosecha?: number | null;
  /** @deprecated usar detalleCosecha.destino */
  destino?: string | null;
  /** @deprecated usar detalleFumigacion.plagaDetectada */
  plagaDetectada?: string | null;
  /** @deprecated usar detalleFumigacion.nivelDano */
  nivelDano?: string | null;
  /** @deprecated usar detalleFumigacion.capacidadTanque */
  capacidadTanque?: number | null;
  /** @deprecated usar detalleFumigacion.numTanques */
  numTanques?: number | null;
  /** @deprecated usar detalleManoObra.numJornales */
  numJornales?: number | null;
  /** @deprecated usar detalleManoObra.pagoJornal */
  pagoJornal?: number | null;
  /** @deprecated usar detalleManoObra.costoManoObra */
  costoManoObra?: number | null;
  /** @deprecated usar detalleManoObra.unidadManoObra */
  unidadManoObra?: UnidadManoObra | null;
  /** @deprecated usar detalleManoObra.cantidadUnidadMo */
  cantidadUnidadMo?: number | null;
  /** @deprecated usar detalleManoObra.precioUnidadMo */
  precioUnidadMo?: number | null;
  /** @deprecated usar detalleManoObra.numTrabajadores */
  numTrabajadores?: number | null;
  /** @deprecated usar detalleManoObra.descripcionUnidadMo */
  descripcionUnidadMo?: string | null;
  /** @deprecated usar detalleManoObra.numTareas */
  numTareas?: number | null;
  /** @deprecated usar detalleManoObra.precioTarea */
  precioTarea?: number | null;
  /** @deprecated usar detalleManoObra.costoSembradores */
  costoSembradores?: number | null;
  /** @deprecated usar detalleMaquinaria.tipoMaquinaria */
  tipoMaquinaria?: string | null;
  /** @deprecated usar detalleMaquinaria.unidadCobro */
  unidadCobro?: 'hora' | 'hectarea' | 'saco' | 'otro' | null;
  /** @deprecated usar detalleMaquinaria.cantidadUnidades */
  cantidadUnidades?: number | null;
  /** @deprecated usar detalleMaquinaria.costoPorUnidad */
  costoPorUnidad?: number | null;
  /** @deprecated usar detalleMaquinaria.costoMaquinaria */
  costoMaquinaria?: number | null;

  
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
  nivelAlerta?: string;
  observaciones?: string;
  ordenPlantilla?: number;
  detalleRiego?: DetalleRiego;
  detalleFumigacion?: DetalleFumigacion;
  detalleFertilizacion?: DetalleFertilizacion;
  detalleCosecha?: DetalleCosecha;
  detalleManoObra?: DetalleManoObra;
  detalleMaquinaria?: DetalleMaquinaria;
  costoInsumos?: number;
  costoTotalActividad?: number;
  productos?: any[];
}

export interface CreateActividadDTO extends UpdateActividadDTO {
  parcelaId?: number;
  cicloId?: number;
  capaId?: number;
}