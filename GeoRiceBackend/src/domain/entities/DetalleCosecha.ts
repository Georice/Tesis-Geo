import { ActividadParcela } from './ActividadParcela';

export interface DetalleCosecha {
  actividadId: number;
  actividad: ActividadParcela;
  rendimientoHa: number;
  totalSacos: number;
  humedad: number;
  precioQq: number;
  ingresoTotal: number;
  costoCosecha: number;
  destino: 'piladora' | 'almacen' | 'directo' | 'otro';
}
