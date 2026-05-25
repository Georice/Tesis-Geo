import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';
import { CapaParcela } from '../../../domain/entities/CapaParcela';

export class UpdateCapaGeometry {
  constructor(private repo: ICapaParcelaRepository) {}

  async execute(id: number, parcelaId: number, geometria: object): Promise<CapaParcela | null> {
    if (!id)        throw new Error('ID de capa inválido');
    if (!parcelaId) throw new Error('ID de parcela inválido');
    if (!geometria) throw new Error('La geometría es obligatoria');
    return this.repo.updateGeometry(id, parcelaId, geometria);
  }
}