import { AppDataSource } from '../DataSource';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import { ProductoActividad } from '../../../domain/entities/ProductoActividad';
import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';

export class ActividadParcelaRepository implements IActividadParcelaRepository {
  private repo         = AppDataSource.getRepository(ActividadParcela);
  private repoProducto = AppDataSource.getRepository(ProductoActividad);

  async findByCiclo(cicloId: number): Promise<ActividadParcela[]> {
    return this.repo.find({
      where: { cicloId },
      relations: ['productos'],
      order: { numeroActividad: 'ASC' },
    });
  }

  async findByParcela(parcelaId: number): Promise<ActividadParcela[]> {
    return this.repo.find({
      where: { parcelaId },
      relations: ['productos'],
      order: { numeroActividad: 'ASC' },
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
  const { productos: _prods, ...dataSinProductos } = data as any;

  const result = await this.repo.insert(dataSinProductos);
  const id = result.identifiers[0].id;

  const prodsAGuardar = productos ?? _prods;
  if (prodsAGuardar && prodsAGuardar.length > 0) {
    const nuevos = prodsAGuardar.map((p: any) =>
      this.repoProducto.create({ ...p, actividadId: id })
    );
    await this.repoProducto.save(nuevos);
  }

  return this.findById(id) as Promise<ActividadParcela>;
}

  async update(
    id: number,
    data: Partial<ActividadParcela>,
    productos?: Partial<ProductoActividad>[]
  ): Promise<ActividadParcela | null> {
    // Separar productos del data para no pasarlos al repo.update
    const { productos: _prods, ...dataSinProductos } = data as any;

    await this.repo.update(id, dataSinProductos);

    const prodsAGuardar = productos ?? _prods;
    if (prodsAGuardar !== undefined) {
      await this.repoProducto.delete({ actividadId: id });
      if (prodsAGuardar.length > 0) {
        const nuevos = prodsAGuardar.map((p: any) =>
          this.repoProducto.create({ ...p, actividadId: id })
        );
        await this.repoProducto.save(nuevos);
      }
    }

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}