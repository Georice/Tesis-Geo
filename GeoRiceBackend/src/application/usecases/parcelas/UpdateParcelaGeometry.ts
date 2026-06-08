import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { AuthContext }        from '../../../shared/types/AuthContext';

export class UpdateParcelaGeometry {
  constructor(private repo: IParcelaRepository) {}

  async execute(id: number, geometria: object, ctx: AuthContext): Promise<any | null> {
    const area = await this.repo.calculateArea(geometria);
    if (area <= 0) throw new Error('La geometría no tiene área válida (área = 0)');

    const overlap = await this.repo.hasOverlap(geometria, id);
    if (overlap) throw new Error('La nueva geometría se superpone con una parcela existente');

    return this.repo.updateGeometry(id, geometria, ctx);
  }
}
