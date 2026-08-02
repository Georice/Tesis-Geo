import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { AuthContext }        from '../../../shared/types/AuthContext';
import { UpdateParcelaDto, ParcelaResponseDto, toParcelaResponseDto } from '../../dtos/parcelas/ParcelaDtos';

export class UpdateParcela {
  constructor(private repo: IParcelaRepository) {}

  async execute(id: number, data: UpdateParcelaDto, ctx: AuthContext): Promise<ParcelaResponseDto | null> {
    const parcela = await this.repo.update(id, data, ctx);
    return parcela ? toParcelaResponseDto(parcela) : null;
  }
}
