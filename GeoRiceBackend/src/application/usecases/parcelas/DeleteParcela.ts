import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';

export class DeleteParcela {
  constructor(private repo: IParcelaRepository) {}

  async execute(id: number): Promise<boolean> {
    return this.repo.delete(id);
  }
}