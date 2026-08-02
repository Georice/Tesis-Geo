import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';
import { CapaResponseDto, toCapaResponseDto } from '../../dtos/capas/CapaDtos';

export class UpdateCapaGeometry {
  constructor(private repo: ICapaParcelaRepository) {}

  async execute(id: number, parcelaId: number, geometria: object): Promise<CapaResponseDto | null> {
    if (!id)        throw new Error('ID de capa inválido');
    if (!parcelaId) throw new Error('ID de parcela inválido');
    if (!geometria) throw new Error('La geometría es obligatoria');
    const capa = await this.repo.updateGeometry(id, parcelaId, geometria);
    return capa ? toCapaResponseDto(capa) : null;
  }
}
