export interface CredencialesLogin {
  id:           string;
  passwordHash: string;
  rol:          string;
  estado:       string;
  nombres:      string;
  apellidos:    string;
}

export interface UsuarioPublico {
  id:            string;
  nombres:       string;
  apellidos:     string;
  email:         string | null;
  rol:           'administrador' | 'socio';
  estado:        'activo' | 'inactivo';
  fechaRegistro: Date;
}

export interface CreateUsuarioDTO {
  nombres:   string;
  apellidos: string;
  email:     string;
  password:  string;
}

export interface UpdateUsuarioDTO {
  nombres?:   string;
  apellidos?: string;
  email?:     string;
  password?:  string;
  estado?:    'activo' | 'inactivo';
}

export interface IUserRepository {
  findByEmail(email: string): Promise<CredencialesLogin | null>;
  findById(id: string): Promise<UsuarioPublico | null>;
  findAll(): Promise<UsuarioPublico[]>;
  findSoloActivos(): Promise<UsuarioPublico[]>;
  create(data: CreateUsuarioDTO, createdBy: string): Promise<UsuarioPublico>;
  update(id: string, data: UpdateUsuarioDTO, updatedBy: string): Promise<UsuarioPublico>;
  activate(id: string, updatedBy: string): Promise<void>;
  deactivate(id: string, updatedBy: string): Promise<void>;
}