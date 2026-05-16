import { AppDataSource } from '../DataSource';
import { Zona } from '../../../domain/entities/Zona';
import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';

export class ZonaRepository implements IZonaRepository {
  private repo = AppDataSource.getRepository(Zona);

  async findAll(): Promise<Zona[]> {
    return this.repo.createQueryBuilder('z')
      .select([
        'z.id',
        'z.nombre',
        'z.descripcion',
        'z.fechaCreacion',
        'ST_AsGeoJSON(z.geometria) AS z_geometria',
      ])
      .getRawMany();
  }

  async findById(id: number): Promise<Zona | null> {
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<Zona>): Promise<Zona> {
    const zona = this.repo.create(data);
    return this.repo.save(zona);
  }

  async update(id: number, data: Partial<Zona>): Promise<Zona | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}