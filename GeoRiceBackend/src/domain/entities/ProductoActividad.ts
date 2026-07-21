import { ActividadParcela } from './ActividadParcela';

export interface ProductoActividad {
  id: number;
  actividadId: number;
  actividad: ActividadParcela;
  nombre: string;
  tipo: 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante' | 'abono' | 'corrector' | 'bioestimulante' | 'otro';
  dosis: number;
  unidad: string;
  dosisPorTanque: number;
  dosisHa: number;
  dosisPorUnidadMo: number;  // kg por saco echado (fertilización)
  dosisTotal: number;

  // ── Presentación ──────────────────────────────────────────────
  presentacionMl: number;  // ml del frasco o gramos del saco (25000=25kg, 50000=50kg)
  precioPresentacion: number;  // precio del frasco/saco completo
  frascoUsados: number;  // calculado: dosis_total ÷ (presentacion_ml/1000)

  // ── Costo ─────────────────────────────────────────────────────
  precioUnitario: number;  // calculado: precio_presentacion ÷ (presentacion_ml/1000)
  costoTotal: number;  // calculado: dosis_total × precio_unitario

  updatedAt: Date;
}
