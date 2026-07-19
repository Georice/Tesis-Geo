import { ICicloRepository } from '../../../domain/repositories/ICicloRepository';
import { CicloResponseDto, toCicloResponseDto } from '../../dtos/ciclos/CicloDtos';

export class FinalizarCiclo {
  constructor(private repo: ICicloRepository) {}

  async execute(id: number): Promise<CicloResponseDto | null> {
    const ciclo = await this.repo.finalizar(id);
    return ciclo ? toCicloResponseDto(ciclo) : null;
  }
}
