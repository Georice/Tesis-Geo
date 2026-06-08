import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { AuthContext }     from '../../../shared/types/AuthContext';

export class UpdateZona {
  constructor(private repo: IZonaRepository) {}

  async execute(id: number, data: any, ctx: AuthContext): Promise<any | null> {
    const zona = await this.repo.update(id, data, ctx);
    if (!zona) return null;
    let parcelasAsignadas: number | undefined;
    if (data.geometria) {
      parcelasAsignadas = await this.repo.assignParcelasInsideZona(id);
    }
    return { ...zona, parcelasAsignadas };
  }
}
