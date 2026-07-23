import { Usuario } from '../../../domain/entities/Usuario';
import { UsuarioModel } from '../models/UsuarioModel';
import { RolUsuario } from '../../../domain/types/UsuarioTypes';

export class UsuarioMapper {
  static toDomain(model: UsuarioModel): Usuario {
    return Usuario.create({
      id:        model.id,
      cedula:    model.cedula,
      nombre:    model.nombre,
      apellido:  model.apellido,
      email:     model.email,
      password:  model.password,
      activo:    model.activo,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }

  // Fila cruda de SQL (AppDataSource.query) con los alias usados por LocalUserRepository.
  // `rol` es el rol EFECTIVO calculado por el JOIN con socios en SELECT_PUB
  // (no existe como columna en usuarios) — se adjunta a la entidad para que
  // toUsuarioResponseDto pueda exponerlo sin que Usuario deje de ser una
  // entidad de dominio limpia.
  static fromRow(row: {
    id: string;
    cedula: string;
    nombre: string;
    apellido: string;
    email: string | null;
    password?: string;
    activo: boolean;
    createdAt: Date;
    updatedAt?: Date;
    rol?: RolUsuario;
  }): Usuario & { rol?: RolUsuario } {
    const usuario = Usuario.create({
      id:        row.id,
      cedula:    row.cedula,
      nombre:    row.nombre,
      apellido:  row.apellido,
      email:     row.email ?? null,
      password:  row.password ?? '',
      activo:    row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt ?? row.createdAt,
    });
    return row.rol !== undefined ? Object.assign(usuario, { rol: row.rol }) : usuario;
  }
}
