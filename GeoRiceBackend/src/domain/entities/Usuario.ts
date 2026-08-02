export interface UsuarioProps {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  email: string | null;
  password: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Entidad de dominio pura: sin decoradores ni dependencias de TypeORM.
// La persistencia vive en infrastructure/db/models/UsuarioModel.ts.
export class Usuario {
  readonly id: string;
  readonly cedula: string;
  readonly nombre: string;
  readonly apellido: string;
  readonly email: string | null;
  readonly password: string;
  readonly activo: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: UsuarioProps) {
    this.id        = props.id;
    this.cedula    = props.cedula;
    this.nombre    = props.nombre;
    this.apellido  = props.apellido;
    this.email     = props.email;
    this.password  = props.password;
    this.activo    = props.activo;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // Factory: única puerta de entrada para construir un Usuario válido,
  // garantiza sus invariantes en vez de dejar que cualquier capa haga `new`.
  //
  // OJO: no se valida password aquí. La columna password tiene
  // `select: false` en UsuarioModel (y SELECT_PUB tampoco la trae) a
  // propósito, para no traer el hash en listados/relaciones donde no hace
  // falta — validar que sea obligatorio en el factory rompía findAll(),
  // findById() y la relación usuario de RefreshTokenRepository. La garantía
  // de que un usuario nuevo tenga contraseña la impone CreateUsuario
  // (application/usecases/usuarios) antes de llegar aquí.
  static create(props: UsuarioProps): Usuario {
    if (!props.cedula?.trim())   throw new Error('La cédula es obligatoria');
    if (!props.nombre?.trim())   throw new Error('El nombre es obligatorio');
    if (!props.apellido?.trim()) throw new Error('El apellido es obligatorio');
    return new Usuario(props);
  }

  get nombreCompleto(): string {
    return `${this.nombre} ${this.apellido}`;
  }
}
