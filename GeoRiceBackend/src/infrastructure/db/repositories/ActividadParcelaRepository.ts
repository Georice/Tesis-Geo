import { AppDataSource } from '../DataSource';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import { ProductoActividad } from '../../../domain/entities/ProductoActividad';
import { DetalleRiego } from '../../../domain/entities/DetalleRiego';
import { DetalleFumigacion } from '../../../domain/entities/DetalleFumigacion';
import { DetalleFertilizacion } from '../../../domain/entities/DetalleFertilizacion';
import { DetalleCosecha } from '../../../domain/entities/DetalleCosecha';
import { DetalleManoObra } from '../../../domain/entities/DetalleManoObra';
import { DetalleMaquinaria } from '../../../domain/entities/DetalleMaquinaria';
import {
  IActividadParcelaRepository,
  PaginatedResult,
  CreateActividadData,
} from '../../../domain/repositories/IActividadParcelaRepository';

const DETALLE_KEYS = [
  'detalleRiego', 'detalleFumigacion', 'detalleFertilizacion',
  'detalleCosecha', 'detalleManoObra', 'detalleMaquinaria',
] as const;

export class ActividadParcelaRepository implements IActividadParcelaRepository {
  private repo         = AppDataSource.getRepository(ActividadParcela);
  private repoProducto = AppDataSource.getRepository(ProductoActividad);
  private repoDetalleRiego        = AppDataSource.getRepository(DetalleRiego);
  private repoDetalleFumigacion   = AppDataSource.getRepository(DetalleFumigacion);
  private repoDetalleFertilizacion = AppDataSource.getRepository(DetalleFertilizacion);
  private repoDetalleCosecha      = AppDataSource.getRepository(DetalleCosecha);
  private repoDetalleManoObra     = AppDataSource.getRepository(DetalleManoObra);
  private repoDetalleMaquinaria   = AppDataSource.getRepository(DetalleMaquinaria);

  //private readonly RELATIONS = ['productos', ...DETALLE_KEYS];
  private readonly RELATIONS = ['productos', 'fase', ...DETALLE_KEYS];


  async findByCiclo(cicloId: number): Promise<ActividadParcela[]> {
    return this.repo.find({
      where: { cicloId },
      relations: this.RELATIONS,
      order: { numeroActividad: 'ASC' },
    });
  }

  async findByParcela(parcelaId: number, page = 1, pageSize = 20): Promise<PaginatedResult<ActividadParcela>> {
    const [data, total] = await this.repo.findAndCount({
      where: { parcelaId },
      relations: this.RELATIONS,
      order: { numeroActividad: 'ASC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
    return { data, total, page, pageSize };
  }

  async findByCapa(capaId: number): Promise<ActividadParcela[]> {
    return this.repo.find({
      where: { capaId },
      relations: this.RELATIONS,
      order: { fecha: 'DESC' },
    });
  }

  async findById(id: number): Promise<ActividadParcela | null> {
    return this.repo.findOne({
      where: { id },
      relations: this.RELATIONS,
    });
  }

  async create(
    data: CreateActividadData,
    productos?: Partial<ProductoActividad>[]
  ): Promise<ActividadParcela> {
    const { productos: _prods, ...rest } = data as any;
    const detalles: Record<string, any> = {};
    for (const key of DETALLE_KEYS) {
      if (rest[key] !== undefined) {
        detalles[key] = rest[key];
        delete rest[key];
      }
    }

    const result = await this.repo.insert(rest);
    const id = result.identifiers[0].id;

    await this.guardarDetalles(id, detalles);

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
    data: CreateActividadData,
    productos?: Partial<ProductoActividad>[]
  ): Promise<ActividadParcela | null> {
    const { productos: _prods, ...rest } = data as any;
    const detalles: Record<string, any> = {};
    for (const key of DETALLE_KEYS) {
      if (rest[key] !== undefined) {
        detalles[key] = rest[key];
        delete rest[key];
      }
    }

    if (Object.keys(rest).length > 0) {
      await this.repo.update(id, rest);
    }

    await this.guardarDetalles(id, detalles);

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

  private async guardarDetalles(actividadId: number, detalles: Record<string, any>): Promise<void> {
    if (detalles.detalleRiego) {
      await this.repoDetalleRiego.save(
        this.repoDetalleRiego.create({ actividadId, ...detalles.detalleRiego })
      );
    }
    if (detalles.detalleFumigacion) {
      await this.repoDetalleFumigacion.save(
        this.repoDetalleFumigacion.create({ actividadId, ...detalles.detalleFumigacion })
      );
    }
    if (detalles.detalleFertilizacion) {
      await this.repoDetalleFertilizacion.save(
        this.repoDetalleFertilizacion.create({ actividadId, ...detalles.detalleFertilizacion })
      );
    }
    if (detalles.detalleCosecha) {
      await this.repoDetalleCosecha.save(
        this.repoDetalleCosecha.create({ actividadId, ...detalles.detalleCosecha })
      );
    }
    if (detalles.detalleManoObra) {
      await this.repoDetalleManoObra.save(
        this.repoDetalleManoObra.create({ actividadId, ...detalles.detalleManoObra })
      );
    }
    if (detalles.detalleMaquinaria) {
      await this.repoDetalleMaquinaria.save(
        this.repoDetalleMaquinaria.create({ actividadId, ...detalles.detalleMaquinaria })
      );
    }
  }
}