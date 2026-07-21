import { Parcela } from '../../../domain/entities/Parcela';
import { ParcelaModel } from '../models/ParcelaModel';

export class ParcelaMapper {
  static toDomain(model: ParcelaModel): Parcela {
    return Parcela.create({
      id:            model.id,
      usuarioId:     model.usuarioId,
      zonaId:        model.zonaId,
      nombre:        model.nombre,
      propietario:   model.propietario,
      cultivo:       model.cultivo,
      geometria:     model.geometria,
      estado:        model.estado,
      cicloActual:   model.cicloActual,
      areaHa:        model.areaHa,
      areaCuadras:   model.areaCuadras,
      fechaCreacion: model.fechaCreacion,
      updatedAt:     model.updatedAt,
      createdBy:     model.createdBy,
      updatedBy:     model.updatedBy,
    });
  }

  // Fila cruda de SQL (ST_AsGeoJSON, columnas con alias camelCase).
  static fromRow(row: {
    id: number;
    usuarioId: string;
    zonaId: number | null;
    nombre: string;
    propietario: string | null;
    cultivo: string;
    geometria: object;
    estado: string;
    cicloActual: string | null;
    areaHa: number;
    areaCuadras: number;
    fechaCreacion: Date;
    updatedAt: Date;
    createdBy?: string | null;
    updatedBy?: string | null;
  }): Parcela {
    return Parcela.create({
      id:            row.id,
      usuarioId:     row.usuarioId,
      zonaId:        row.zonaId,
      nombre:        row.nombre,
      propietario:   row.propietario,
      cultivo:       row.cultivo,
      geometria:     row.geometria,
      estado:        row.estado as Parcela['estado'],
      cicloActual:   row.cicloActual as Parcela['cicloActual'],
      areaHa:        row.areaHa,
      areaCuadras:   row.areaCuadras,
      fechaCreacion: row.fechaCreacion,
      updatedAt:     row.updatedAt,
      createdBy:     row.createdBy ?? null,
      updatedBy:     row.updatedBy ?? null,
    });
  }
}
