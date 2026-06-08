export interface CredencialesLogin {
  id:           number;
  passwordHash: string;
  rol:          string;
  estado:       string;
  cedula:       string;
  nombres:      string;
  apellidos:    string;
}

export interface UsuarioPublico {
  id:            number;
  cedula:        string;
  nombres:       string;
  apellidos:     string;
  usuario:       string;
  rol:           'administrador' | 'socio';
  estado:        'activo' | 'inactivo';
  fechaRegistro: Date;
}

export interface CreateUsuarioDTO {
  cedula:    string;
  nombres:   string;
  apellidos: string;
  usuario:   string;
  password:  string;
  rol:       'administrador' | 'socio';
}

export interface UpdateUsuarioDTO {
  cedula?:    string;
  nombres?:   string;
  apellidos?: string;
  usuario?:   string;
  password?:  string;
  rol?:       'administrador' | 'socio';
  estado?:    'activo' | 'inactivo';
}

// Contrato puro. AuthService depende sólo de esta interfaz.
// LocalUserRepository la implementa en Etapa 1.
// ExternalUserRepository la implementará en Etapa 2 sin tocar AuthService.
export interface IUserRepository {
  findByUsuario(usuario: string): Promise<CredencialesLogin | null>;
  findById(id: number): Promise<UsuarioPublico | null>;
  findAll(): Promise<UsuarioPublico[]>;
  findSoloActivos(): Promise<UsuarioPublico[]>;
  create(data: CreateUsuarioDTO, createdBy: number): Promise<UsuarioPublico>;
  update(id: number, data: UpdateUsuarioDTO, updatedBy: number): Promise<UsuarioPublico>;
  activate(id: number, updatedBy: number): Promise<void>;
  deactivate(id: number, updatedBy: number): Promise<void>;
}
