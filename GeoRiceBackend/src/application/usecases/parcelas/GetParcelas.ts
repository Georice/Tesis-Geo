import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { Parcela } from '../../../domain/entities/Parcela';

export class GetParcelas {
  constructor(private repo: IParcelaRepository) {}

  async execute(): Promise<Parcela[]> {
    return this.repo.findAll();
  }
}