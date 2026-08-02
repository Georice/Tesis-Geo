import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';
import { CapaResponseDto, toCapaResponseDto } from '../../dtos/capas/CapaDtos';

export class GetCapasByParcela {
  constructor(private repo: ICapaParcelaRepository) {}

  async execute(parcelaId: number): Promise<CapaResponseDto[]> {
    const capas = await this.repo.findByParcela(parcelaId);
    return capas.map(toCapaResponseDto);
  }
}
