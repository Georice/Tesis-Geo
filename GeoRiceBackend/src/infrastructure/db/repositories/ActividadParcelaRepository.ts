import { AppDataSource } from '../DataSource';
import { ActividadParcelaModel } from '../models/ActividadParcelaModel';
import { ProductoActividadModel } from '../models/ProductoActividadModel';
import { DetalleRiegoModel } from '../models/DetalleRiegoModel';
import { DetalleFumigacionModel } from '../models/DetalleFumigacionModel';
import { DetalleFertilizacionModel } from '../models/DetalleFertilizacionModel';
import { DetalleCosechaModel } from '../models/DetalleCosechaModel';
import { DetalleManoObraModel } from '../models/DetalleManoObraModel';
import { DetalleMaquinariaModel } from '../models/DetalleMaquinariaModel';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import {
  IActividadParcelaRepository,
  PaginatedResult,
  ActividadComando,
  ProductoComando,
  DetalleRiegoComando,
  DetalleFumigacionComando,
  DetalleFertilizacionComando,
  DetalleCosechaComando,
  DetalleManoObraComando,
  DetalleMaquinariaComando,
} from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcelaMapper } from '../mappers/ActividadParcelaMapper';

interface DetallesComando {
  detalleRiego?:         DetalleRiegoComando;
  detalleFumigacion?:    DetalleFumigacionComando;
  detalleFertilizacion?: DetalleFertilizacionComando;
  detalleCosecha?:       DetalleCosechaComando;
  detalleManoObra?:      DetalleManoObraComando;
  detalleMaquinaria?:    DetalleMaquinariaComando;
}

export class ActividadParcelaRepository implements IActividadParcelaRepository {
  private repo         = AppDataSource.getRepository(ActividadParcelaModel);
  private repoProducto = AppDataSource.getRepository(ProductoActividadModel);
  private repoDetalleRiego         = AppDataSource.getRepository(DetalleRiegoModel);
  private repoDetalleFumigacion    = AppDataSource.getRepository(DetalleFumigacionModel);
  private repoDetalleFertilizacion = AppDataSource.getRepository(DetalleFertilizacionModel);
  private repoDetalleCosecha       = AppDataSource.getRepository(DetalleCosechaModel);
  private repoDetalleManoObra      = AppDataSource.getRepository(DetalleManoObraModel);
  private repoDetalleMaquinaria    = AppDataSource.getRepository(DetalleMaquinariaModel);

  private readonly RELATIONS = [
    'productos', 'fase',
    'detalleRiego', 'detalleFumigacion', 'detalleFertilizacion',
    'detalleCosecha', 'detalleManoObra', 'detalleMaquinaria',
  ];

  async findByCiclo(cicloId: number): Promise<ActividadParcela[]> {
    const rows = await this.repo.find({
      where: { cicloId },
      relations: this.RELATIONS,
      order: { numeroActividad: 'ASC' },
    });
    return rows.map(ActividadParcelaMapper.toDomain);
  }

  async findByParcela(parcelaId: number, page = 1, pageSize = 20): Promise<PaginatedResult<ActividadParcela>> {
    const [rows, total] = await this.repo.findAndCount({
      where: { parcelaId },
      relations: this.RELATIONS,
      order: { numeroActividad: 'ASC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
    return { data: rows.map(ActividadParcelaMapper.toDomain), total, page, pageSize };
  }

  async findByCapa(capaId: number): Promise<ActividadParcela[]> {
    const rows = await this.repo.find({
      where: { capaId },
      relations: this.RELATIONS,
      order: { fecha: 'DESC' },
    });
    return rows.map(ActividadParcelaMapper.toDomain);
  }

  async findById(id: number): Promise<ActividadParcela | null> {
    const row = await this.repo.findOne({
      where: { id },
      relations: this.RELATIONS,
    });
    return row ? ActividadParcelaMapper.toDomain(row) : null;
  }

  async create(data: ActividadComando, productos?: ProductoComando[]): Promise<ActividadParcela> {
    const { detalleRiego, detalleFumigacion, detalleFertilizacion, detalleCosecha, detalleManoObra, detalleMaquinaria, ...rest } = data;

    const result = await this.repo.insert(rest);
    const id = result.identifiers[0].id;

    await this.guardarDetalles(id, {
      detalleRiego, detalleFumigacion, detalleFertilizacion,
      detalleCosecha, detalleManoObra, detalleMaquinaria,
    });

    if (productos && productos.length > 0) {
      const nuevos = productos.map(p => this.repoProducto.create({ ...p, actividadId: id }));
      await this.repoProducto.save(nuevos);
    }

    return (await this.findById(id))!;
  }

  async update(id: number, data: Partial<ActividadComando>, productos?: ProductoComando[]): Promise<ActividadParcela | null> {
    const { detalleRiego, detalleFumigacion, detalleFertilizacion, detalleCosecha, detalleManoObra, detalleMaquinaria, ...rest } = data;

    if (Object.keys(rest).length > 0) {
      await this.repo.update(id, rest);
    }

    await this.guardarDetalles(id, {
      detalleRiego, detalleFumigacion, detalleFertilizacion,
      detalleCosecha, detalleManoObra, detalleMaquinaria,
    });

    if (productos !== undefined) {
      await this.repoProducto.delete({ actividadId: id });
      if (productos.length > 0) {
        const nuevos = productos.map(p => this.repoProducto.create({ ...p, actividadId: id }));
        await this.repoProducto.save(nuevos);
      }
    }

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private async guardarDetalles(actividadId: number, detalles: DetallesComando): Promise<void> {
    if (detalles.detalleRiego) {
      await this.repoDetalleRiego.save(
        this.repoDetalleRiego.create({ actividadId, ...sinNulos(detalles.detalleRiego) })
      );
    }
    if (detalles.detalleFumigacion) {
      await this.repoDetalleFumigacion.save(
        this.repoDetalleFumigacion.create({ actividadId, ...sinNulos(detalles.detalleFumigacion) })
      );
    }
    if (detalles.detalleFertilizacion) {
      await this.repoDetalleFertilizacion.save(
        this.repoDetalleFertilizacion.create({ actividadId, ...sinNulos(detalles.detalleFertilizacion) })
      );
    }
    if (detalles.detalleCosecha) {
      await this.repoDetalleCosecha.save(
        this.repoDetalleCosecha.create({ actividadId, ...sinNulos(detalles.detalleCosecha) })
      );
    }
    if (detalles.detalleManoObra) {
      await this.repoDetalleManoObra.save(
        this.repoDetalleManoObra.create({ actividadId, ...sinNulos(detalles.detalleManoObra) })
      );
    }
    if (detalles.detalleMaquinaria) {
      await this.repoDetalleMaquinaria.save(
        this.repoDetalleMaquinaria.create({ actividadId, ...sinNulos(detalles.detalleMaquinaria) })
      );
    }
  }
}

// Los comandos de detalle aceptan `null` (vienen de recombinar con la
// entidad ya persistida); TypeORM solo acepta `undefined` para "sin valor".
function sinNulos<T extends object>(obj: T): { [K in keyof T]: Exclude<T[K], null> | undefined } {
  const out: any = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = value === null ? undefined : value;
  }
  return out;
}
