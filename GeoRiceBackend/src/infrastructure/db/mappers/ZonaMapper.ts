import { Zona } from '../../../domain/entities/Zona';
import { ZonaModel } from '../models/ZonaModel';

export class ZonaMapper {
  static toDomain(model: ZonaModel): Zona {
    return Zona.create({
      id:            model.id,
      usuarioId:     model.usuarioId,
      nombre:        model.nombre,
      descripcion:   model.descripcion,
      geometria:     model.geometria,
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
    nombre: string;
    descripcion: string | null;
    geometria: object | null;
    fechaCreacion: Date;
    updatedAt: Date;
    createdBy?: string | null;
    updatedBy?: string | null;
  }): Zona {
    return Zona.create({
      id:            row.id,
      usuarioId:     row.usuarioId,
      nombre:        row.nombre,
      descripcion:   row.descripcion,
      geometria:     row.geometria,
      fechaCreacion: row.fechaCreacion,
      updatedAt:     row.updatedAt,
      createdBy:     row.createdBy ?? null,
      updatedBy:     row.updatedBy ?? null,
    });
  }
}
