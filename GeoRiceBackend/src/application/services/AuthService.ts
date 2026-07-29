import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { AppDataSource } from '../../infrastructure/db/DataSource';

export interface JwtPayload {
  sub:      string;
  rol:      'administrador' | 'socio';
  nombre:   string;
  apellido: string;
}

export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
  ) {}

  async login(login: string, password: string) {
    const user = await this.userRepo.findByEmail(login);
    if (!user) throw new Error('Credenciales incorrectas');
    if (!user.activo) throw new Error('Usuario inactivo. Contacte al administrador.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Credenciales incorrectas');

    const rol = await this.resolveRol(user.cedula);

    const payload: JwtPayload = {
      sub:      user.id,
      rol,
      nombre:   user.nombre,
      apellido: user.apellido,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const { refreshToken, tokenHash, expiresAt } = this.generateRefreshToken();

    await this.refreshTokenRepo.create(user.id, tokenHash, expiresAt);

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

    const rol = await this.resolveRol(record.usuario.cedula);

    const payload: JwtPayload = {
      sub:      record.usuario.id,
      rol,
      nombre:   record.usuario.nombre,
      apellido: record.usuario.apellido,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const { refreshToken, tokenHash: newHash, expiresAt: newExpires } = this.generateRefreshToken();

    await this.refreshTokenRepo.create(record.usuario.id, newHash, newExpires);

    return { accessToken, refreshToken };
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshTokenRepo.revokeByHash(tokenHash);
  }

  // Rol efectivo: por defecto 'socio' (solo existe en usuarios). Si la misma
  // cédula aparece en socios (tabla maestra de MagnaRice) y es PRESIDENTE o
  // tiene nivelAcceso ADMIN, sube a 'administrador'. Única fuente de verdad
  // para el rol — la usan tanto login() como refresh() para no repetir la
  // inconsistencia que había antes (refresh consultaba socios, login no).
  private async resolveRol(cedula: string): Promise<'administrador' | 'socio'> {
    const rows = await AppDataSource.query(
      `SELECT rol, "nivelAcceso" AS "nivelAcceso"
       FROM public.socios
       WHERE cedula = $1
       LIMIT 1`,
      [cedula],
    );
    const socio = rows[0];
    if (socio && (socio.rol === 'PRESIDENTE' || socio.nivelAcceso === 'ADMIN')) {
      return 'administrador';
    }
    return 'socio';
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
