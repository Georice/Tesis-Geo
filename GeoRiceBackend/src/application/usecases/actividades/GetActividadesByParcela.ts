import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';

export class GetActividadesByParcela {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(parcelaId: number): Promise<ActividadParcela[]> {
    return this.repo.findByParcela(parcelaId);
  }
}