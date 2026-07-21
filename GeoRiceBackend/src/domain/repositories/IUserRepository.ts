import { Usuario } from '../entities/Usuario';
import { RolUsuario, EstadoUsuario } from '../types/UsuarioTypes';

export interface CredencialesLogin {
  id:           string;
  passwordHash: string;
  rol:          string;
  estado:       string;
  nombres:      string;
  apellidos:    string;
}

export interface NuevoUsuarioComando {
  nombres:    string;
  apellidos:  string;
  cedula:     string;
  usuario?:   string;
  email?:     string;
  password:   string;
  rol?:       RolUsuario;
}

export interface ActualizarUsuarioComando {
  nombres?:   string;
  apellidos?: string;
  cedula?:    string;
  usuario?:   string;
  email?:     string;
  password?:  string;
  estado?:    EstadoUsuario;
  rol?:       RolUsuario;
}

export interface IUserRepository {
  findByEmail(login: string): Promise<CredencialesLogin | null>;
  findById(id: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  findSoloActivos(): Promise<Usuario[]>;
  create(data: NuevoUsuarioComando, createdBy: string): Promise<Usuario>;
  update(id: string, data: ActualizarUsuarioComando, updatedBy: string): Promise<Usuario>;
  activate(id: string, updatedBy: string): Promise<void>;
  deactivate(id: string, updatedBy: string): Promise<void>;
}
