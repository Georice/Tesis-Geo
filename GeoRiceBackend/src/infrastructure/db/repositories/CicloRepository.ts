import { DeepPartial } from 'typeorm';
import { AppDataSource } from '../DataSource';
import { CicloActividadEntity } from '../entities/CicloActividadEntity';
import { CicloActividad } from '../../../domain/entities/CicloActividad';
import { ICicloRepository } from '../../../domain/repositories/ICicloRepository';

export class CicloRepository implements ICicloRepository {
  private repo = AppDataSource.getRepository(CicloActividadEntity);

  async findActivoByParcela(parcelaId: number): Promise<CicloActividad | null> {
    return this.repo.findOne({ where: { parcelaId, estado: 'activo' } });
  }

  async findByParcela(parcelaId: number): Promise<CicloActividad[]> {
    return this.repo.find({ where: { parcelaId }, order: { fechaInicio: 'DESC' } });
  }

  async findById(id: number): Promise<CicloActividad | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<CicloActividad>): Promise<CicloActividad> {
    const ciclo = this.repo.create(data as DeepPartial<CicloActividadEntity>);
    return this.repo.save(ciclo);
  }

  async finalizar(id: number): Promise<CicloActividad | null> {
    await this.repo.update(id, { estado: 'completado', fechaFin: new Date() });
    return this.findById(id);
  }
}
