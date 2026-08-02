export interface AuthContext {
  usuarioId:      string;   // UUID — id de public.usuarios (MagnaRice)
  rol:            'administrador' | 'socio';
  nombreCompleto: string;
}