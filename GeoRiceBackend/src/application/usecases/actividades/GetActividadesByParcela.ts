/*import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela }            from '../../../domain/entities/ActividadParcela';
import { AppDataSource }               from '../../../infrastructure/db/DataSource';
import { CicloActividad }              from '../../../domain/entities/CicloActividad';

export class GetActividadesByParcela {
  constructor(private repo: IActividadParcelaRepository) {}

  // async execute(parcelaId: number): Promise<ActividadParcela[]> {
  //   // Buscar ciclo activo
  //   const cicloRepo  = AppDataSource.getRepository(CicloActividad);
  //   const cicloActivo = await cicloRepo.findOne({
  //     where: { parcelaId, estado: 'activo' },
  //   });

  //   // Si hay ciclo activo, mostrar solo sus actividades
  //   if (cicloActivo) {
  //     return this.repo.findByCiclo(cicloActivo.id);
  //   }

  //   // Si no hay ciclo activo, no mostrar actividades
  //   return [];
  // }

//   async execute(parcelaId: number): Promise<ActividadParcela[]> {
//   const cicloRepo = AppDataSource.getRepository(CicloActividad);
//   const cicloActivo = await cicloRepo.findOne({
//     where: { parcelaId, estado: 'activo' },
//   });

//   if (cicloActivo) {
//     return this.repo.findByCiclo(cicloActivo.id);
//   }

//   // Sin ciclo activo → mostrar todas las actividades de la parcela
//   return this.repo.findByParcela(parcelaId);
// }

async execute(parcelaId: number): Promise<ActividadParcela[]> {
  return this.repo.findByParcela(parcelaId);
}
}*/


import { IActividadParcelaRepository, PaginatedResult } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela }            from '../../../domain/entities/ActividadParcela';
import { AppDataSource }               from '../../../infrastructure/db/DataSource';
import { CicloActividad }              from '../../../domain/entities/CicloActividad';

export class GetActividadesByParcela {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(parcelaId: number, page?: number, pageSize?: number): Promise<PaginatedResult<ActividadParcela>> {
    const cicloRepo   = AppDataSource.getRepository(CicloActividad);
    const cicloActivo = await cicloRepo.findOne({
      where: { parcelaId, estado: 'activo' },
    });

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


