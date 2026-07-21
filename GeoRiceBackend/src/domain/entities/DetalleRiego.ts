import { ActividadParcela } from './ActividadParcela';

export interface DetalleRiego {
  actividadId: number;
  actividad: ActividadParcela;
  laminaAgua: number;
}
