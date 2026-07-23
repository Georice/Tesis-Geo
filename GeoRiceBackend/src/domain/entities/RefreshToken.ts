export interface RefreshTokenProps {
  id: number;
  usuarioId: string;
  tokenHash: string;
  expiresAt: Date;
  creadoEn: Date;
  revocado: boolean;
}

// Entidad de dominio pura: sin decoradores de TypeORM.
export class RefreshToken {
  readonly id: number;
  readonly usuarioId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly creadoEn: Date;
  readonly revocado: boolean;

  private constructor(props: RefreshTokenProps) {
    this.id        = props.id;
    this.usuarioId = props.usuarioId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.creadoEn  = props.creadoEn;
    this.revocado  = props.revocado;
  }

  static create(props: RefreshTokenProps): RefreshToken {
    if (!props.usuarioId)  throw new Error('El refresh token debe pertenecer a un usuario');
    if (!props.tokenHash)  throw new Error('El refresh token debe tener un hash');
    if (!props.expiresAt)  throw new Error('El refresh token debe tener fecha de expiración');
    return new RefreshToken(props);
  }

  get expirado(): boolean {
    return this.expiresAt < new Date();
  }

  get valido(): boolean {
    return !this.revocado && !this.expirado;
  }
}
