import { ICicloRepository } from '../../../domain/repositories/ICicloRepository';
import { CicloResponseDto, toCicloResponseDto } from '../../dtos/ciclos/CicloDtos';

export class GetCiclosByParcela {
  constructor(private repo: ICicloRepository) {}

  async execute(parcelaId: number): Promise<CicloResponseDto[]> {
    const ciclos = await this.repo.findByParcela(parcelaId);
    return ciclos.map(toCicloResponseDto);
  }
}
