import { AppDataSource } from '../DataSource';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import { ProductoActividad } from '../../../domain/entities/ProductoActividad';
import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';

export class ActividadParcelaRepository implements IActividadParcelaRepository {
  async findByCiclo(cicloId: number): Promise<ActividadParcela[]> {
    return this.repo.find({
      where: { cicloId },
      relations: ['productos'],
      order: { fecha: 'DESC' },
    });
  }
  private repo         = AppDataSource.getRepository(ActividadParcela);
  private repoProducto = AppDataSource.getRepository(ProductoActividad);

  async findByParcela(parcelaId: number): Promise<ActividadParcela[]> {
    return this.repo.find({
      where: { parcelaId },
      relations: ['productos'],
      order: { fecha: 'DESC' },
    });
  }

  async findByCapa(capaId: number): Promise<ActividadParcela[]> {
    return this.repo.find({
      where: { capaId },
      relations: ['productos'],
      order: { fecha: 'DESC' },
    });
  }

  async findById(id: number): Promise<ActividadParcela | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['productos'],
    });
  }

  async create(
    data: Partial<ActividadParcela>,
    productos?: Partial<ProductoActividad>[]
  ): Promise<ActividadParcela> {
    const actividad = this.repo.create(data);
    const saved     = await this.repo.save(actividad);

    if (productos && productos.length > 0) {
      const prods = productos.map(p =>
        this.repoProducto.create({ ...p, actividadId: saved.id })
      );
      await this.repoProducto.save(prods);
    }

    return this.findById(saved.id) as Promise<ActividadParcela>;
  }

  async update(
    id: number,
    data: Partial<ActividadParcela>,
    productos?: Partial<ProductoActividad>[]
  ): Promise<ActividadParcela | null> {
    await this.repo.update(id, data);

    if (productos !== undefined) {
      // Eliminar productos anteriores y reemplazar
      await this.repoProducto.delete({ actividadId: id });
      if (productos.length > 0) {
        const prods = productos.map(p =>
          this.repoProducto.create({ ...p, actividadId: id })
        );
        await this.repoProducto.save(prods);
      }
    }

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}