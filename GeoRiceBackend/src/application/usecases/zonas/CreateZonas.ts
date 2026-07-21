import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { AuthContext }     from '../../../shared/types/AuthContext';
import { CreateZonaDto, ZonaResponseDto, toZonaResponseDto } from '../../dtos/zonas/ZonaDtos';

export class CreateZona {
  constructor(private repo: IZonaRepository) {}

  async execute(data: CreateZonaDto, ctx: AuthContext): Promise<ZonaResponseDto> {
    if (!data.nombre) throw new Error('El nombre de la zona es obligatorio');
    const zona = await this.repo.create(data, ctx);
    let parcelasAsignadas = 0;
    if (data.geometria) {
      parcelasAsignadas = await this.repo.assignParcelasInsideZona(zona.id);
    }
    return toZonaResponseDto(zona, parcelasAsignadas);
  }
}
