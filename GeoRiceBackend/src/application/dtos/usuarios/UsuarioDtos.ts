import { RolUsuario, EstadoUsuario } from '../../../domain/types/UsuarioTypes';
import { Usuario } from '../../../domain/entities/Usuario';

// Contratos de entrada/salida en el borde HTTP. No se exponen las
// entidades de dominio directamente a los controllers/clientes.
export interface CreateUsuarioDto {
  nombres:    string;
  apellidos:  string;
  cedula:     string;
  usuario?:   string;
  email?:     string;
  password:   string;
  rol?:       RolUsuario;
}

export interface UpdateUsuarioDto {
  nombres?:   string;
  apellidos?: string;
  cedula?:    string;
  usuario?:   string;
  email?:     string;
  password?:  string;
  estado?:    EstadoUsuario;
  rol?:       RolUsuario;
}

export interface UsuarioResponseDto {
  id:            string;
  nombres:       string;
  apellidos:     string;
  cedula:        string;
  usuario:       string;
  email:         string | null;
  rol:           RolUsuario;
  estado:        EstadoUsuario;
  fechaRegistro: Date;
}

export function toUsuarioResponseDto(usuario: Usuario): UsuarioResponseDto {
  return {
    id:            String(usuario.id),
    nombres:       usuario.nombres,
    apellidos:     usuario.apellidos,
    cedula:        usuario.cedula,
    usuario:       usuario.usuario,
    email:         usuario.email,
    rol:           usuario.rol,
    estado:        usuario.estado,
    fechaRegistro: usuario.fechaRegistro,
  };
}
