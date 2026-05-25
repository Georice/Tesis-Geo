import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';
import { ProductoActividad } from '../../../domain/entities/ProductoActividad';

export class UpdateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(
    id: number,
    data: Partial<ActividadParcela>,
    productos?: Partial<ProductoActividad>[]
  ): Promise<ActividadParcela | null> {
    if (!id) throw new Error('ID de actividad inválido');

    // Recalcular ingreso total si se actualizan sacos o precio
    if (data.totalSacos && data.precioQq) {
      data.ingresoTotal = Number(data.totalSacos) * Number(data.precioQq);
    }

    return this.repo.update(id, data, productos);
  }
}