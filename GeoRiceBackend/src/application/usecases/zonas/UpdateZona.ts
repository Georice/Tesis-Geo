import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { Zona } from '../../../domain/entities/Zona';

export class UpdateZona {
  constructor(private repo: IZonaRepository) {}

  async execute(id: number, data: Partial<Zona>): Promise<Zona | null> {
    return this.repo.update(id, data);
  }
}