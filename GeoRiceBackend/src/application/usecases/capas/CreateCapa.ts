import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';
import { CapaParcela } from '../../../domain/entities/CapaParcela';

export class CreateCapa {
  constructor(private repo: ICapaParcelaRepository) {}

  async execute(data: Partial<CapaParcela>): Promise<CapaParcela> {
    if (!data.geometria) {
      throw new Error('La geometría de la capa es obligatoria');
    }
    if (!data.parcelaId) {
      throw new Error('La parcela es obligatoria');
    }
    const dentroDeparcela = await this.repo.isInsideParcela(data.parcelaId, data.geometria);
    if (!dentroDeparcela) {
      throw new Error('La capa debe estar dentro de los límites de la parcela');
    }
    return this.repo.create(data);
  }
}