import { IParcelaRepository } from '../../domain/repositories/IParcelaRepository';
import { Parcela } from '../../domain/entities/Parcela';

export class UpdateParcela {
  constructor(private repo: IParcelaRepository) {}

  async execute(id: number, data: Partial<Parcela>): Promise<Parcela | null> {
    return this.repo.update(id, data);
  }
}