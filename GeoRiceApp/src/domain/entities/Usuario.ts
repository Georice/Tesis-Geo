export interface Usuario {
  id:        string;
  nombre:    string;
  apellido:  string;
  cedula?:   string;
  email:     string | null;
  rol:       'administrador' | 'socio';
  activo:    boolean;
}

export interface CreateUsuarioDto {
  nombre:    string;
  apellido:  string;
  email?:    string;
  cedula?:   string;
  password:  string;
}

export interface UpdateUsuarioDto {
  nombre?:   string;
  apellido?: string;
  cedula?:   string;
  email?:    string;
}
