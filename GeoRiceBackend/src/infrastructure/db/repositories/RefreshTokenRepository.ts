import { AppDataSource } from '../DataSource';
import { RefreshTokenModel } from '../models/RefreshTokenModel';
import { RefreshToken } from '../../../domain/entities/RefreshToken';
import {
  IRefreshTokenRepository,
  RefreshTokenConUsuario,
} from '../../../domain/repositories/IRefreshTokenRepository';
import { RefreshTokenMapper } from '../mappers/RefreshTokenMapper';
import { UsuarioMapper } from '../mappers/UsuarioMapper';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  private repo = AppDataSource.getRepository(RefreshTokenModel);

  async create(usuarioId: number, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    const saved = await this.repo.save(
      this.repo.create({ usuarioId, tokenHash, expiresAt }),
    );
    return RefreshTokenMapper.toDomain(saved);
  }

  async findActivoConUsuario(tokenHash: string): Promise<RefreshTokenConUsuario | null> {
    const record = await this.repo.findOne({
      where: { tokenHash, revocado: false },
      relations: ['usuario'],
    });
    if (!record) return null;

    return {
      token:   RefreshTokenMapper.toDomain(record),
      usuario: UsuarioMapper.toDomain(record.usuario),
    };
  }

  async revoke(id: number): Promise<void> {
    await this.repo.update(id, { revocado: true });
  }

  async revokeByHash(tokenHash: string): Promise<void> {
    await this.repo.update({ tokenHash }, { revocado: true });
  }
}
