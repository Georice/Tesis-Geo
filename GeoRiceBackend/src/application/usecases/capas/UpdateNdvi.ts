import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';
import { CapaParcela } from '../../../domain/entities/CapaParcela';

export class UpdateNdvi {
  constructor(private repo: ICapaParcelaRepository) {}

  async execute(id: number, ndviEstimado: number): Promise<CapaParcela | null> {
    if (ndviEstimado < 0 || ndviEstimado > 1) {
      throw new Error('El NDVI debe estar entre 0 y 1');
    }
    return this.repo.updateNdvi(id, ndviEstimado);
  }
}