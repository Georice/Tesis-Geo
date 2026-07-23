import { RefreshToken } from '../entities/RefreshToken';
import { Usuario } from '../entities/Usuario';

export interface RefreshTokenConUsuario {
  token:   RefreshToken;
  usuario: Usuario;
}

export interface IRefreshTokenRepository {
  create(usuarioId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken>;
  findActivoConUsuario(tokenHash: string): Promise<RefreshTokenConUsuario | null>;
  revoke(id: number): Promise<void>;
  revokeByHash(tokenHash: string): Promise<void>;
}
