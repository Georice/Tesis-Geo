import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { AppDataSource } from '../../infrastructure/db/DataSource';

export interface JwtPayload {
  sub:       string;
  rol:       'administrador' | 'socio';
  nombres:   string;
  apellidos: string;
}

export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error('Credenciales incorrectas');
    if (user.estado !== 'activo') throw new Error('Usuario inactivo. Contacte al administrador.');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Credenciales incorrectas');

    const payload: JwtPayload = {
      sub:       String(user.id),
      rol:       user.rol as 'administrador' | 'socio',
      nombres:   user.nombres,
      apellidos: user.apellidos,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const { refreshToken, tokenHash, expiresAt } = this.generateRefreshToken();

    await this.refreshTokenRepo.create(Number(user.id), tokenHash, expiresAt);

    return { accessToken, refreshToken, usuario: payload };
  }

  async refresh(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const record = await this.refreshTokenRepo.findActivoConUsuario(tokenHash);

    if (!record || record.token.expirado) {
      throw new Error('Refresh token inválido o expirado');
    }
    if (!record.usuario.activo) {
      throw new Error('Usuario inactivo');
    }

    await this.refreshTokenRepo.revoke(record.token.id);

    // El rol efectivo puede venir de una tabla legada `socios` (nivel_acceso ADMIN).
    const socioRows = await AppDataSource.query(
      `SELECT
        CASE
          WHEN s.nivel_acceso = 'ADMIN' THEN 'administrador'
          WHEN s.id IS NULL THEN u.rol
          ELSE 'socio'
        END AS rol
       FROM usuarios u
       LEFT JOIN socios s ON s.usuario_id = u.id
       WHERE u.id = $1 LIMIT 1`,
      [record.usuario.id],
    );
    const rol = (socioRows[0]?.rol ?? 'socio') as 'administrador' | 'socio';

    const payload: JwtPayload = {
      sub:       String(record.usuario.id),
      rol,
      nombres:   record.usuario.nombres,
      apellidos: record.usuario.apellidos,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const { refreshToken, tokenHash: newHash, expiresAt: newExpires } = this.generateRefreshToken();

    await this.refreshTokenRepo.create(Number(record.usuario.id), newHash, newExpires);

    return { accessToken, refreshToken };
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshTokenRepo.revokeByHash(tokenHash);
  }

  private generateRefreshToken() {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash    = this.hashToken(refreshToken);
    const expiresAt    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return { refreshToken, tokenHash, expiresAt };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
