import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { Zona } from '../../../domain/entities/Zona';

export class UpdateZona {
  constructor(private repo: IZonaRepository) {}

  async execute(id: number, data: Partial<Zona>): Promise<(Zona & { parcelasAsignadas?: number }) | null> {
    const zona = await this.repo.update(id, data);
    if (!zona) return null;
    let parcelasAsignadas: number | undefined;
   if (data.geometria) {
  parcelasAsignadas = await this.repo.assignParcelasInsideZona(id);
}
    return { ...zona, parcelasAsignadas };
  }
}