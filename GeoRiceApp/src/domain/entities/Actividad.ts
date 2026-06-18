export type TipoActividad =
  | 'preparacion_suelo' | 'inundacion' | 'siembra_boleo' | 'siembra_trasplante'
  | 'riego' | 'fertilizacion' | 'fumigacion' | 'deshierba' | 'cosecha'
  | 'rozar_quemar' | 'soca_riego' | 'soca_fertilizacion' | 'soca_fumigacion'
  | 'cosecha_soca' | 'observacion';

export type TipoProducto =
  | 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante'
  | 'abono' | 'corrector' | 'bioestimulante' | 'otro';

export type UnidadManoObra = 'jornal' | 'tanque' | 'saco' | 'tarea' | 'otro';

// export interface ProductoActividad {
//   id?: number;
//   actividadId?: number;
//   nombre: string;
//   tipo: TipoProducto;
//   dosis?: number | null;
//   unidad?: string | null;
//   dosisPorTanque?: number | null;
//   dosisHa?: number | null;
//   dosisTotal?: number | null;
//   // ── NUEVO: costo ──────────────────────────────────────
//   precioUnitario?: number | null;  // $ por L, kg, etc.
//   costoTotal?: number | null;      // dosisTotal × precioUnitario
// }

export interface ProductoActividad {
  id?: number;
  actividadId?: number;
  nombre: string;
  tipo: TipoProducto;
  dosis?: number | null;
  unidad?: string | null;
  dosisPorTanque?: number | null;
  dosisHa?: number | null;
  dosisPorUnidadMo?: number | null;  // kg por saco echado (fertilización)
  dosisTotal?: number | null;
  // ── Presentación ──────────────────────────────────────
  presentacionMl?: number | null;      // ml del frasco o gramos del saco
  precioPresentacion?: number | null;  // precio del frasco/saco completo
  frascoUsados?: number | null;        // calculado: frascos/sacos consumidos
  // ── Costo ─────────────────────────────────────────────
  precioUnitario?: number | null;  // calculado: precio_presentacion ÷ (ml/1000)
  costoTotal?: number | null;      // calculado: dosisTotal × precioUnitario
}

export interface Actividad {
  id: number;
  parcelaId: number;
  capaId?: number | null;
  cicloId?: number | null;
  // ── Numeración ────────────────────────────────────────
  numeroActividad?: number | null;
  tipo: TipoActividad;
  fecha: string;
  // ── Estado ───────────────────────────────────────────
  estado?: 'pendiente' | 'en_proceso' | 'completada';
  fechaInicio?: string | null;
  fechaFin?: string | null;
  // ── General ───────────────────────────────────────────
  insumo?: string | null;
  cantidad?: number | null;
  unidad?: string | null;
  metodo?: string | null;
  // ── Riego ─────────────────────────────────────────────
  laminaAgua?: number | null;
  // ── Cosecha ───────────────────────────────────────────
  rendimientoHa?: number | null;
  totalSacos?: number | null;
  humedad?: number | null;
  precioQq?: number | null;
  ingresoTotal?: number | null;
  costoCosecha?: number | null;
  destino?: string | null;
  // ── Plagas ────────────────────────────────────────────
  plagaDetectada?: string | null;
  nivelDano?: string | null;
  nivelAlerta?: string | null;
  // ── Tanques ───────────────────────────────────────────
  capacidadTanque?: number | null;
  numTanques?: number | null;
  // ── Mano de obra legacy ───────────────────────────────
  numJornales?: number | null;
  pagoJornal?: number | null;
  costoManoObra?: number | null;
  // ── Mano de obra nuevo modelo ─────────────────────────
  unidadManoObra?: UnidadManoObra | null;
  cantidadUnidadMo?: number | null;   // total tanques/sacos/jornales
  precioUnidadMo?: number | null;     // $ por unidad
  numTrabajadores?: number | null;    // personas que trabajaron
  descripcionUnidadMo?: string | null; // solo para 'otro'
  // ── Sembradores trasplante ────────────────────────────
  numTareas?: number | null;          // calculado: area_ha × 16
  precioTarea?: number | null;        // $ por tarea
  costoSembradores?: number | null;   // total al grupo
  // ── Maquinaria ────────────────────────────────────────
  tipoMaquinaria?: string | null;
  unidadCobro?: 'hora' | 'hectarea' | 'saco' | 'otro' | null;
  cantidadUnidades?: number | null;
  costoPorUnidad?: number | null;
  costoMaquinaria?: number | null;
  // ── Costos calculados ─────────────────────────────────
  costoInsumos?: number | null;
  costoTotalActividad?: number | null;
  // ── Otros ─────────────────────────────────────────────
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
  // mano de obra legacy
  numJornales?: number;
  pagoJornal?: number;
  costoManoObra?: number;
  // mano de obra nuevo modelo
  unidadManoObra?: UnidadManoObra;
  cantidadUnidadMo?: number;
  precioUnidadMo?: number;
  numTrabajadores?: number;
  descripcionUnidadMo?: string;
  // sembradores
  numTareas?: number;
  precioTarea?: number;
  costoSembradores?: number;
  // maquinaria
  tipoMaquinaria?: string;
  unidadCobro?: string;
  cantidadUnidades?: number;
  costoPorUnidad?: number;
  costoMaquinaria?: number;
  // costos
  costoInsumos?: number;
  costoTotalActividad?: number;
  productos?: any[];
}

export interface CreateActividadDTO extends UpdateActividadDTO {
  parcelaId?: number;
  cicloId?: number;
  capaId?: number;
}