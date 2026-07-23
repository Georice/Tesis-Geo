import { IsNull } from 'typeorm';
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

  async create(usuarioId: string, hashToken: string, expiraEn: Date): Promise<RefreshToken> {
    const saved = await this.repo.save(
      this.repo.create({ usuarioId, hashToken, expiraEn }),
    );
    return RefreshTokenMapper.toDomain(saved);
  }

  async findActivoConUsuario(hashToken: string): Promise<RefreshTokenConUsuario | null> {
    const record = await this.repo.findOne({
      where: { hashToken, revocadoEn: IsNull() },
      relations: ['usuario'],
    });
    if (!record) return null;

    return {
      token:   RefreshTokenMapper.toDomain(record),
      usuario: UsuarioMapper.toDomain(record.usuario),
    };
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update(id, { revocadoEn: new Date() });
  }

  async revokeByHash(hashToken: string): Promise<void> {
    await this.repo.update({ hashToken }, { revocadoEn: new Date() });
  }
}
