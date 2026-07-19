import { CapaParcela } from '../../../domain/entities/CapaParcela';
import { CapaParcelaModel } from '../models/CapaParcelaModel';

export class CapaParcelaMapper {
  static toDomain(model: CapaParcelaModel): CapaParcela {
    return CapaParcela.create({
      id:                 model.id,
      parcelaId:          model.parcelaId,
      tipo:               model.tipo,
      geometria:          model.geometria,
      ndviEstimado:       model.ndviEstimado,
      fechaActualizacion: model.fechaActualizacion,
      updatedAt:          model.updatedAt,
      createdBy:          model.createdBy,
      updatedBy:          model.updatedBy,
    });
  }
}
