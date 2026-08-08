import { Usuario } from '../entities/Usuario';

export interface CredencialesLogin {
  id:           string;
  cedula:       string;
  password:     string;
  activo:       boolean;
  nombre:       string;
  apellido:     string;
}

export interface NuevoUsuarioComando {
  nombre:     string;
  apellido:   string;
  cedula:     string;
  email?:     string;
  password:   string;
}

export interface ActualizarUsuarioComando {
  nombre?:    string;
  apellido?:  string;
  cedula?:    string;
  email?:     string;
  password?:  string;
}

export interface IUserRepository {
  findByEmail(login: string): Promise<CredencialesLogin | null>;
  findById(id: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  findSoloActivos(): Promise<Usuario[]>;
  create(data: NuevoUsuarioComando, activo?: boolean): Promise<Usuario>;
  update(id: string, data: ActualizarUsuarioComando): Promise<Usuario>;
  activate(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
}