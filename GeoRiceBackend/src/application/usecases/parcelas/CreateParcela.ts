import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { AuthContext }        from '../../../shared/types/AuthContext';
import { CreateParcelaDto, ParcelaResponseDto, toParcelaResponseDto } from '../../dtos/parcelas/ParcelaDtos';

export class CreateParcela {
  constructor(private repo: IParcelaRepository) {}

  async execute(data: CreateParcelaDto, ctx: AuthContext): Promise<ParcelaResponseDto> {
    if (!data.geometria) throw new Error('La geometría es obligatoria');
    const parcela = await this.repo.create(data, ctx);
    return toParcelaResponseDto(parcela);
  }
}
