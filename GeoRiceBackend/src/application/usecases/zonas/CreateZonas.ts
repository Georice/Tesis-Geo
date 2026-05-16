import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { Zona } from '../../../domain/entities/Zona';

export class CreateZona {
  constructor(private repo: IZonaRepository) {}

  async execute(data: Partial<Zona>): Promise<Zona> {
    if (!data.nombre) {
      throw new Error('El nombre de la zona es obligatorio');
    }
    return this.repo.create(data);
  }
}