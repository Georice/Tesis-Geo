import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { ActividadParcela } from '../../../domain/entities/ActividadParcela';

export class CreateActividad {
  constructor(private repo: IActividadParcelaRepository) {}

  async execute(data: Partial<ActividadParcela>): Promise<ActividadParcela> {
    if (!data.parcelaId) {
      throw new Error('La parcela es obligatoria');
    }
    if (!data.tipo) {
      throw new Error('El tipo de actividad es obligatorio');
    }
    return this.repo.create(data);
  }
}