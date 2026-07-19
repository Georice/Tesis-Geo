import { CicloActividad } from '../../../domain/entities/CicloActividad';
import { CicloActividadModel } from '../models/CicloActividadModel';
import { FaseCiclo } from '../../../domain/entities/FaseCiclo';
import { FaseCicloModel } from '../models/FaseCicloModel';

export class CicloActividadMapper {
  static toDomain(model: CicloActividadModel): CicloActividad {
    return CicloActividad.create({
      id:              model.id,
      parcelaId:       model.parcelaId,
      tipo:            model.tipo,
      estado:          model.estado,
      fechaInicio:     model.fechaInicio,
      fechaFin:        model.fechaFin ?? null,
      variedadSemilla: model.variedadSemilla ?? null,
      areaSembrada:    model.areaSembrada ?? null,
      observaciones:   model.observaciones ?? null,
      fechaRegistro:   model.fechaRegistro,
      updatedAt:       model.updatedAt,
      createdBy:       model.createdBy,
      updatedBy:       model.updatedBy,
    });
  }
}

export class FaseCicloMapper {
  static toDomain(model: FaseCicloModel): FaseCiclo {
    return FaseCiclo.create({
      id:             model.id,
      codigo:         model.codigo,
      nombre:         model.nombre,
      tipoCiclo:      model.tipoCiclo,
      ordenFase:      model.ordenFase,
      ordenMin:       model.ordenMin,
      ordenMax:       model.ordenMax,
      tiposActividad: model.tiposActividad,
      descripcion:    model.descripcion ?? null,
      createdAt:      model.createdAt,
    });
  }
}
