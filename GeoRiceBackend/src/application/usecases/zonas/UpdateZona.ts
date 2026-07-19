import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { AuthContext }     from '../../../shared/types/AuthContext';
import { UpdateZonaDto, ZonaResponseDto, toZonaResponseDto } from '../../dtos/zonas/ZonaDtos';

export class UpdateZona {
  constructor(private repo: IZonaRepository) {}

  async execute(id: number, data: UpdateZonaDto, ctx: AuthContext): Promise<ZonaResponseDto | null> {
    const zona = await this.repo.update(id, data, ctx);
    if (!zona) return null;
    let parcelasAsignadas: number | undefined;
    if (data.geometria) {
      parcelasAsignadas = await this.repo.assignParcelasInsideZona(id);
    }
    return toZonaResponseDto(zona, parcelasAsignadas);
  }
}
