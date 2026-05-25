export interface Capa {
  id: number;
  parcelaId: number;
  tipo: 'activo' | 'descanso' | 'lindero';
  geometria: object;
  ndviEstimado: string | number;
  fechaActualizacion: string;
}

export interface CreateCapaDTO {
  tipo: 'activo' | 'descanso' | 'lindero';
  geometria: object;
  ndviEstimado?: number;
}