import { ActividadParcela } from './ActividadParcela';

export interface DetalleFumigacion {
  actividadId: number;
  actividad: ActividadParcela;
  plagaDetectada: string;
  nivelDano: 'leve' | 'moderado' | 'severo';
  capacidadTanque: number;
  numTanques: number;
}
