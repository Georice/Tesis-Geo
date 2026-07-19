import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { AuthContext }        from '../../../shared/types/AuthContext';
import { ParcelaResponseDto, toParcelaResponseDto } from '../../dtos/parcelas/ParcelaDtos';

export class GetParcelas {
  constructor(private repo: IParcelaRepository) {}

  async execute(ctx: AuthContext): Promise<ParcelaResponseDto[]> {
    const parcelas = await this.repo.findAll(ctx);
    return parcelas.map(toParcelaResponseDto);
  }
}
