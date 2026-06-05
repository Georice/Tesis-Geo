import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { Parcela } from '../../../domain/entities/Parcela';

export class CreateParcela {
  constructor(private repo: IParcelaRepository) {}

  async execute(data: Partial<Parcela>): Promise<Parcela> {
    if (!data.geometria) {
      throw new Error('La geometría es obligatoria');
    }
    return this.repo.create(data);
  }
}