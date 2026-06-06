import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
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
}