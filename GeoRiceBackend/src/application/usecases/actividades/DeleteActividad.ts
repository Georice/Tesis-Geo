import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';

export class DeleteActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(id: number): Promise<boolean> {
    return this.repo.delete(id);
  }
}