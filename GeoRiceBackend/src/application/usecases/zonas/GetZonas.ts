import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { AuthContext }     from '../../../shared/types/AuthContext';
import { ZonaResponseDto, toZonaResponseDto } from '../../dtos/zonas/ZonaDtos';

export class GetZonas {
  constructor(private repo: IZonaRepository) {}

  async execute(ctx: AuthContext): Promise<ZonaResponseDto[]> {
    const zonas = await this.repo.findAll(ctx);
    return zonas.map(z => toZonaResponseDto(z));
  }
}
