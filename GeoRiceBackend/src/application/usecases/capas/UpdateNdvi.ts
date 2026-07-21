import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';
import { CapaResponseDto, toCapaResponseDto } from '../../dtos/capas/CapaDtos';

export class UpdateNdvi {
  constructor(private repo: ICapaParcelaRepository) {}

  async execute(id: number, ndviEstimado: number): Promise<CapaResponseDto | null> {
    if (ndviEstimado < 0 || ndviEstimado > 1) {
      throw new Error('El NDVI debe estar entre 0 y 1');
    }
    const capa = await this.repo.updateNdvi(id, ndviEstimado);
    return capa ? toCapaResponseDto(capa) : null;
  }
}
