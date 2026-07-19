import { Usuario } from '../../../domain/entities/Usuario';
import { UsuarioModel } from '../models/UsuarioModel';

export class UsuarioMapper {
  static toDomain(model: UsuarioModel): Usuario {
    return Usuario.create({
      id:            model.id,
      cedula:        model.cedula,
      nombres:       model.nombres,
      apellidos:     model.apellidos,
      usuario:       model.usuario,
      passwordHash:  model.passwordHash,
      rol:           model.rol,
      estado:        model.estado,
      email:         model.email,
      fechaRegistro: model.fechaRegistro,
      updatedAt:     model.updatedAt,
      updatedBy:     model.updatedBy,
    });
  }

  // Fila cruda de SQL (AppDataSource.query) con los alias usados por LocalUserRepository.
  static fromRow(row: {
    id: string | number;
    cedula: string;
    nombres: string;
    apellidos: string;
    usuario: string;
    passwordHash?: string;
    rol: string;
    estado: string;
    email: string | null;
    fechaRegistro: Date;
    updatedAt?: Date;
    updatedBy?: string | null;
  }): Usuario {
    return Usuario.create({
      id:            Number(row.id),
      cedula:        row.cedula,
      nombres:       row.nombres,
      apellidos:     row.apellidos,
      usuario:       row.usuario,
      passwordHash:  row.passwordHash ?? '',
      rol:           row.rol as Usuario['rol'],
      estado:        row.estado as Usuario['estado'],
      email:         row.email ?? null,
      fechaRegistro: row.fechaRegistro,
      updatedAt:     row.updatedAt ?? row.fechaRegistro,
      updatedBy:     row.updatedBy ?? null,
    });
  }
}
