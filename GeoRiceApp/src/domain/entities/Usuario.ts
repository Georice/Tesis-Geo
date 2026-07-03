export interface Usuario {
  id:        string;
  nombres:   string;
  apellidos: string;
  email:     string | null;
  rol:       'administrador' | 'socio';
  estado:    'activo' | 'inactivo';
}

export interface CreateUsuarioDto {
  nombres:   string;
  apellidos: string;
  email:     string;
  password:  string;
}

export interface UpdateUsuarioDto {
  nombres?:   string;
  apellidos?: string;
  email?:     string;
}