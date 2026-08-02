import { RefreshToken } from '../../../domain/entities/RefreshToken';
import { RefreshTokenModel } from '../models/RefreshTokenModel';

export class RefreshTokenMapper {
  static toDomain(model: RefreshTokenModel): RefreshToken {
    return RefreshToken.create({
      id:         model.id,
      usuarioId:  model.usuarioId,
      hashToken:  model.hashToken,
      expiraEn:   model.expiraEn,
      revocadoEn: model.revocadoEn,
      createdAt:  model.createdAt,
    });
  }
}
