import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { Parcela } from '../../../domain/entities/Parcela';

export class UpdateParcelaGeometry {
  constructor(private repo: IParcelaRepository) {}

  async execute(id: number, geometria: object): Promise<Parcela | null> {
    // Validar que el área no sea 0
    const area = await this.repo.calculateArea(geometria);
    if (area <= 0) {
      throw new Error('La geometría de la parcela no tiene área válida (área = 0)');
    }

    // Validar superposición excluyendo la parcela actual
    const overlap = await this.repo.hasOverlap(geometria, id);
    if (overlap) {
      throw new Error('La nueva geometría se superpone con una parcela existente');
    }

    return this.repo.updateGeometry(id, geometria);
  }
}