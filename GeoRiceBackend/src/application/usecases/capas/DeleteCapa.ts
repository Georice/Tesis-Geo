import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';

export class DeleteCapa {
  constructor(private repo: ICapaParcelaRepository) {}

  async execute(id: number): Promise<boolean> {
    return this.repo.delete(id);
  }
}