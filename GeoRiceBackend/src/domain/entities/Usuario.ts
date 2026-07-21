export interface Usuario {
  id: number;
  cedula: string;
  nombres: string;
  apellidos: string;
  usuario: string;
  passwordHash: string;
  rol: string;
  estado: string;
  email: string | null;
  fechaRegistro: Date;
  updatedAt: Date;
  readonly activo: boolean;
}
