import { RefreshToken } from '../../../domain/entities/RefreshToken';
import { RefreshTokenModel } from '../models/RefreshTokenModel';

export class RefreshTokenMapper {
  static toDomain(model: RefreshTokenModel): RefreshToken {
    return RefreshToken.create({
      id:        model.id,
      usuarioId: model.usuarioId,
      tokenHash: model.tokenHash,
      expiresAt: model.expiresAt,
      creadoEn:  model.creadoEn,
      revocado:  model.revocado,
    });
  }
}
