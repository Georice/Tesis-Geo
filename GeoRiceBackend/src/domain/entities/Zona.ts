import { Usuario } from './Usuario';

export interface Zona {
  id: number;
  usuarioId: string;
  usuario: Usuario;
  nombre: string;
  descripcion: string | null;
  geometria: object;
  fechaCreacion: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
