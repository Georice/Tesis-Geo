import { Usuario } from './Usuario';

export interface RefreshToken {
  id: number;
  usuarioId: number;
  usuario: Usuario;
  tokenHash: string;
  expiresAt: Date;
  creadoEn: Date;
  revocado: boolean;
}
