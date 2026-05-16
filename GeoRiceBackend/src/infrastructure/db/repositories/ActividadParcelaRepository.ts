import { AppDataSource } from '../DataSource';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';

export class ActividadParcelaRepository implements IActividadParcelaRepository {
  private repo = AppDataSource.getRepository(ActividadParcela);

  async findByParcela(parcelaId: number): Promise<ActividadParcela[]> {
    return this.repo.find({
      where: { parcelaId },
      order: { fecha: 'DESC' },
    });
  }

  async findByCapa(capaId: number): Promise<ActividadParcela[]> {
    return this.repo.find({
      where: { capaId },
      order: { fecha: 'DESC' },
    });
  }

  async findById(id: number): Promise<ActividadParcela | null> {
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<ActividadParcela>): Promise<ActividadParcela> {
    const actividad = this.repo.create(data);
    return this.repo.save(actividad);
  }

  async update(id: number, data: Partial<ActividadParcela>): Promise<ActividadParcela | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}