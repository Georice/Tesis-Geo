import { Parcela } from './Parcela';

export interface CapaParcela {
  id: number;
  parcelaId: number;
  parcela: Parcela;
  tipo: 'activo' | 'descanso' | 'lindero';
  geometria: object;
  ndviEstimado: number;
  fechaActualizacion: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
