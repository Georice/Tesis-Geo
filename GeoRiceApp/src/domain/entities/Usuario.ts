export interface Usuario {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  usuario: string;
  rol: 'administrador' | 'socio';
  estado: 'activo' | 'inactivo';
}

export interface CreateUsuarioDto {
  cedula: string;
  nombres: string;
  apellidos: string;
  usuario: string;
  password: string;
  rol: 'administrador' | 'socio';
}

export interface UpdateUsuarioDto {
  cedula?: string;
  nombres?: string;
  apellidos?: string;
  usuario?: string;
  rol?: 'administrador' | 'socio';
}