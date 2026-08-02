import { RolUsuario } from '../../../domain/types/UsuarioTypes';
import { Usuario } from '../../../domain/entities/Usuario';

// Contratos de entrada/salida en el borde HTTP. No se exponen las
// entidades de dominio directamente a los controllers/clientes.
export interface CreateUsuarioDto {
  nombre:    string;
  apellido:  string;
  cedula:    string;
  email?:    string;
  password:  string;
}

export interface UpdateUsuarioDto {
  nombre?:   string;
  apellido?: string;
  cedula?:   string;
  email?:    string;
  password?: string;
}

// rol es el rol EFECTIVO (resuelto vía JOIN con socios en
// LocalUserRepository), no una columna propia de usuarios.
export interface UsuarioResponseDto {
  id:        string;
  nombre:    string;
  apellido:  string;
  cedula:    string;
  email:     string | null;
  activo:    boolean;
  rol:       RolUsuario;
  createdAt: Date;
}

export function toUsuarioResponseDto(usuario: Usuario & { rol?: RolUsuario }): UsuarioResponseDto {
  return {
    id:        usuario.id,
    nombre:    usuario.nombre,
    apellido:  usuario.apellido,
    cedula:    usuario.cedula,
    email:     usuario.email,
    activo:    usuario.activo,
    rol:       usuario.rol ?? 'socio',
    createdAt: usuario.createdAt,
  };
}
