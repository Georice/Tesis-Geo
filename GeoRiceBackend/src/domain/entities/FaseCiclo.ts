export interface FaseCiclo {
  id: number;
  codigo: string; // F1...F6
  nombre: string;
  tipoCiclo: 'siembra_boleo' | 'siembra_trasplante' | 'soca' | 'resoca';
  ordenFase: number;
  ordenMin: number;
  ordenMax: number;
  tiposActividad: string[];
  descripcion: string;
  createdAt: Date;
}
