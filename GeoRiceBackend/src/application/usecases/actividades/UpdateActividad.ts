import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';

export class UpdateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(id: number, data: Partial<ActividadParcela>): Promise<ActividadParcela | null> {
    if (!id) {
      throw new Error('El id de la actividad es obligatorio');
    }
    const actividad = await this.repo.findById(id);
    if (!actividad) {
      throw new Error('Actividad no encontrada');
    }
    return this.repo.update(id, data);
  }
}