import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';
import { CapaParcela } from '../../../domain/entities/CapaParcela';

export class GetCapasByParcela {
  constructor(private repo: ICapaParcelaRepository) {}

  async execute(parcelaId: number): Promise<CapaParcela[]> {
    return this.repo.findByParcela(parcelaId);
  }
}