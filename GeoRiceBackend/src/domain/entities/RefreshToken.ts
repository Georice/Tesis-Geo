export interface RefreshTokenProps {
  id: string;
  usuarioId: string;
  hashToken: string;
  expiraEn: Date;
  revocadoEn: Date | null;
  createdAt: Date;
}

// Entidad de dominio pura: sin decoradores de TypeORM.
// Persiste en la tabla "tokens_actualizacion" (Prisma/MagnaRice) — GeoRice
// reutiliza esa tabla en vez de mantener su propio "refresh_tokens".
export class RefreshToken {
  readonly id: string;
  readonly usuarioId: string;
  readonly hashToken: string;
  readonly expiraEn: Date;
  readonly revocadoEn: Date | null;
  readonly createdAt: Date;

  private constructor(props: RefreshTokenProps) {
    this.id         = props.id;
    this.usuarioId  = props.usuarioId;
    this.hashToken  = props.hashToken;
    this.expiraEn   = props.expiraEn;
    this.revocadoEn = props.revocadoEn;
    this.createdAt  = props.createdAt;
  }

  static create(props: RefreshTokenProps): RefreshToken {
    if (!props.usuarioId)  throw new Error('El refresh token debe pertenecer a un usuario');
    if (!props.hashToken)  throw new Error('El refresh token debe tener un hash');
    if (!props.expiraEn)   throw new Error('El refresh token debe tener fecha de expiración');
    return new RefreshToken(props);
  }

  get expirado(): boolean {
    return this.expiraEn < new Date();
  }

  get valido(): boolean {
    return !this.revocadoEn && !this.expirado;
  }
}
