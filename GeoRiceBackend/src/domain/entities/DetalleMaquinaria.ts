import { ActividadParcela } from './ActividadParcela';

export interface DetalleMaquinaria {
  actividadId: number;
  actividad: ActividadParcela;
  tipoMaquinaria: string;
  unidadCobro: 'hora' | 'hectarea' | 'saco' | 'otro';
  cantidadUnidades: number;
  costoPorUnidad: number;
  costoMaquinaria: number;
}
