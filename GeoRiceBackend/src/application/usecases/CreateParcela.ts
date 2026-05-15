import { IParcelaRepository } from '../../domain/repositories/IParcelaRepository';
import { Parcela } from '../../domain/entities/Parcela';

export class CreateParcela {
  constructor(private repo: IParcelaRepository) {}

  async execute(data: Partial<Parcela>): Promise<Parcela> {
    if (!data.geometria) {
      throw new Error('La geometría es obligatoria');
    }

    // Validar que el área no sea 0
    const area = await this.repo.calculateArea(data.geometria);
    if (area <= 0) {
      throw new Error('La geometría de la parcela no tiene área válida (área = 0)');
    }

    // Validar que no se superponga con otra parcela
    const overlap = await this.repo.hasOverlap(data.geometria);
    if (overlap) {
      throw new Error('La parcela se superpone con una parcela existente');
    }

    return this.repo.create(data);
  }
}