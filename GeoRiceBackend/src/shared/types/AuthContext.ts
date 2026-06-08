export interface AuthContext {
  usuarioId:      number;
  rol:            'administrador' | 'socio';
  nombreCompleto: string;
}
