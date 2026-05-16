import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { Zona } from '../../../domain/entities/Zona';

export class GetZonas {
  constructor(private repo: IZonaRepository) {}

  async execute(): Promise<Zona[]> {
    return this.repo.findAll();
  }
}