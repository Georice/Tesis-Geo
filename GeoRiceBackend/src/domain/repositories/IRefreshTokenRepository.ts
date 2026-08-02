import { RefreshToken } from '../entities/RefreshToken';
import { Usuario } from '../entities/Usuario';

export interface RefreshTokenConUsuario {
  token:   RefreshToken;
  usuario: Usuario;
}

export interface IRefreshTokenRepository {
  create(usuarioId: string, hashToken: string, expiraEn: Date): Promise<RefreshToken>;
  findActivoConUsuario(hashToken: string): Promise<RefreshTokenConUsuario | null>;
  revoke(id: string): Promise<void>;
  revokeByHash(hashToken: string): Promise<void>;
}
