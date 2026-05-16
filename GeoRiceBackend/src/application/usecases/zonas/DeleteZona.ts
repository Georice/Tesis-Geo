import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';

export class DeleteZona {
  constructor(private repo: IZonaRepository) {}

  async execute(id: number): Promise<boolean> {
    return this.repo.delete(id);
  }
}