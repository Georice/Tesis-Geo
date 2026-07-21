import { Parcela } from './Parcela';

export interface CicloActividad {
  id: number;
  parcelaId: number;
  parcela: Parcela;
  tipo: 'siembra_boleo' | 'siembra_trasplante' | 'soca' | 'resoca';
  estado: 'activo' | 'completado' | 'cancelado';
  fechaInicio: Date;
  fechaFin: Date;
  variedadSemilla: string;
  areaSembrada: number;
  observaciones: string;
  fechaRegistro: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
