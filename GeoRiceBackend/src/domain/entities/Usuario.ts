import { RolUsuario, EstadoUsuario } from '../types/UsuarioTypes';

export interface UsuarioProps {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  usuario: string;
  passwordHash: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  email: string | null;
  fechaRegistro: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

// Entidad de dominio pura: sin decoradores ni dependencias de TypeORM.
// La persistencia vive en infrastructure/db/models/UsuarioModel.ts.
export class Usuario {
  readonly id: number;
  readonly cedula: string;
  readonly nombres: string;
  readonly apellidos: string;
  readonly usuario: string;
  readonly passwordHash: string;
  readonly rol: RolUsuario;
  readonly estado: EstadoUsuario;
  readonly email: string | null;
  readonly fechaRegistro: Date;
  readonly updatedAt: Date;
  readonly updatedBy: string | null;

  private constructor(props: UsuarioProps) {
    this.id            = props.id;
    this.cedula         = props.cedula;
    this.nombres        = props.nombres;
    this.apellidos      = props.apellidos;
    this.usuario        = props.usuario;
    this.passwordHash   = props.passwordHash;
    this.rol            = props.rol;
    this.estado         = props.estado;
    this.email          = props.email;
    this.fechaRegistro  = props.fechaRegistro;
    this.updatedAt      = props.updatedAt;
    this.updatedBy      = props.updatedBy;
  }

  // Factory: única puerta de entrada para construir un Usuario válido,
  // garantiza sus invariantes en vez de dejar que cualquier capa haga `new`.
  //
  // OJO: no se valida passwordHash aquí. La columna password_hash tiene
  // `select: false` en UsuarioModel (y SELECT_PUB tampoco la trae) a
  // propósito, para no traer el hash en listados/relaciones donde no hace
  // falta — validar que sea obligatorio en el factory rompía findAll(),
  // findById() y la relación usuario de RefreshTokenRepository. La garantía
  // de que un usuario nuevo tenga contraseña la impone CreateUsuario
  // (application/usecases/usuarios) antes de llegar aquí.
  static create(props: UsuarioProps): Usuario {
    if (!props.cedula?.trim())    throw new Error('La cédula es obligatoria');
    if (!props.nombres?.trim())   throw new Error('Los nombres son obligatorios');
    if (!props.apellidos?.trim()) throw new Error('Los apellidos son obligatorios');
    if (!props.usuario?.trim())   throw new Error('El nombre de usuario es obligatorio');
    return new Usuario(props);
  }

  get activo(): boolean {
    return this.estado === 'activo';
  }

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`;
  }
}
