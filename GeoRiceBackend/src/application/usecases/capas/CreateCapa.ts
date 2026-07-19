import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';
import { CreateCapaDto, CapaResponseDto, toCapaResponseDto } from '../../dtos/capas/CapaDtos';

export class CreateCapa {
  constructor(private repo: ICapaParcelaRepository) {}

  async execute(data: CreateCapaDto & { createdBy: string; updatedBy: string }): Promise<CapaResponseDto> {
    if (!data.geometria) throw new Error('La geometría de la capa es obligatoria');
    if (!data.parcelaId) throw new Error('La parcela es obligatoria');
    const capa = await this.repo.create(data);
    return toCapaResponseDto(capa);
  }
}
