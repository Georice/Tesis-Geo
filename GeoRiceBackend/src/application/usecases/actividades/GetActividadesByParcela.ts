import { IActividadParcelaRepository, PaginatedResult } from '../../../domain/repositories/IActividadParcelaRepository';
import { ICicloRepository } from '../../../domain/repositories/ICicloRepository';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';

export class GetActividadesByParcela {
  constructor(
    private repo: IActividadParcelaRepository,
    private cicloRepo: ICicloRepository,
  ) {}

  async execute(parcelaId: number, page?: number, pageSize?: number): Promise<PaginatedResult<ActividadParcela>> {
    const cicloActivo = await this.cicloRepo.findActivoByParcela(parcelaId);

    if (cicloActivo) {
      // Ciclo activo: pocas actividades (máx. ~11 según plantilla),
      // se devuelven todas sin paginar pero en el mismo shape.
      const actividades = await this.repo.findByCiclo(cicloActivo.id);
      return {
        data: actividades,
        total: actividades.length,
        page: 1,
        pageSize: actividades.length,
      };
    }

    // Sin ciclo activo: mostrar histórico completo, paginado.
    return this.repo.findByParcela(parcelaId, page, pageSize);
  }
}
