import { Zona }    from './Zona';
import { Usuario } from './Usuario';

export interface Parcela {
  id: number;
  usuarioId: string;
  usuario: Usuario;
  zonaId: number | null;
  zona: Zona;
  nombre: string;
  // Mantenido por compatibilidad. Se auto-rellena desde usuario.nombres+apellidos.
  propietario: string | null;
  cultivo: string;
  geometria: object;
  estado: 'activo' | 'descanso' | 'cosechado' | 'preparacion';
  cicloActual: 'siembra_normal_boleo' | 'siembra_normal_trasplante' | 'soca' | 'resoca' | 'en_preparacion';
  areaHa: number;
  areaCuadras: number;
  fechaCreacion: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}
