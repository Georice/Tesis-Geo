import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';

import { Zona } from '../../../domain/entities/Zona';

export class CreateZona {
  constructor(private repo: IZonaRepository) {}

  async execute(data: Partial<Zona>): Promise<Zona & { parcelasAsignadas: number }> {
    if (!data.nombre) throw new Error('El nombre de la zona es obligatorio');
    const zona = await this.repo.create(data);
    let parcelasAsignadas = 0;
    if (data.geometria) {
      // Usar la geometría ya guardada en BD para el ST_Contains
      parcelasAsignadas = await this.repo.assignParcelasInsideZona(zona.id);
    }
    return { ...zona, parcelasAsignadas };
  }
}