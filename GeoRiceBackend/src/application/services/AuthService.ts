import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { AppDataSource } from '../../infrastructure/db/DataSource';
import { EmailService } from '../../infrastructure/services/EmailService';

export interface JwtPayload {
  sub:      string;
  rol:      'administrador' | 'socio';
  nombre:   string;
  apellido: string;
}

type ResetUserRow = {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
};

export class AuthService {
  private readonly email = new EmailService();

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
      throw new Error('Refresh token invalido o expirado');
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

  async forgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const message = 'Si el correo existe, recibiras un codigo de recuperacion.';

    if (!normalizedEmail) {
      throw new Error('El correo es requerido');
    }

    await this.ensurePasswordResetTable();

    const user = await this.findUserByEmail(normalizedEmail);
    if (!user || !user.activo) {
      return { mensaje: message, resetCode: null };
    }

    const codigo = this.createPasswordResetCode();
    const codigoHash = this.hashPasswordResetCode(normalizedEmail, codigo);
    const expiraEn = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await AppDataSource.query(
      `UPDATE public.georice_password_reset_tokens
       SET usado_en = NOW()
       WHERE usuario_id = $1 AND usado_en IS NULL`,
      [user.id],
    );

    await AppDataSource.query(
      `INSERT INTO public.georice_password_reset_tokens
        (usuario_id, codigo_hash, expira_en)
       VALUES ($1, $2, $3)`,
      [user.id, codigoHash, expiraEn],
    );

    let sent = false;
    try {
      const result = await this.email.sendPasswordResetCode({
        toEmail: user.email,
        nombre: `${user.nombre} ${user.apellido}`,
        codigo,
      });
      sent = result.sent;
    } catch (error) {
      console.error('[email] No se pudo enviar el codigo de recuperacion GeoRice', error);
    }

    if (!sent && process.env.NODE_ENV !== 'production') {
      return {
        mensaje: 'SMTP no esta configurado. Para pruebas, usa el codigo mostrado en pantalla y en la consola del backend.',
        resetCode: codigo,
      };
    }

    return { mensaje: message, resetCode: null };
  }

  async resetPassword(email: string, codigo: string, newPassword: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const cleanCode = this.normalizeCode(codigo);

    if (!normalizedEmail || !cleanCode) {
      throw new Error('Correo y codigo son requeridos');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('La contrasena debe tener al menos 8 caracteres');
    }

    await this.ensurePasswordResetTable();

    const user = await this.findUserByEmail(normalizedEmail);
    if (!user || !user.activo) {
      throw new Error('Codigo de recuperacion invalido o expirado');
    }

    const codigoHash = this.hashPasswordResetCode(normalizedEmail, cleanCode);
    const rows = await AppDataSource.query(
      `SELECT id
       FROM public.georice_password_reset_tokens
       WHERE usuario_id = $1
         AND codigo_hash = $2
         AND usado_en IS NULL
         AND expira_en > NOW()
       ORDER BY creado_en DESC
       LIMIT 1`,
      [user.id, codigoHash],
    );

    const token = rows[0];
    if (!token) {
      throw new Error('Codigo de recuperacion invalido o expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await AppDataSource.transaction(async manager => {
      await manager.query(
        `UPDATE public.usuarios
         SET password = $1, "updatedAt" = NOW()
         WHERE id = $2`,
        [passwordHash, user.id],
      );
      await manager.query(
        `UPDATE public.georice_password_reset_tokens
         SET usado_en = NOW()
         WHERE id = $1`,
        [token.id],
      );
    });

    return { mensaje: 'Contrasena actualizada correctamente' };
  }

  // Rol efectivo: por defecto 'socio' (solo existe en usuarios). Si la misma
  // cedula aparece en socios (tabla maestra de MagnaRice) y es PRESIDENTE o
  // tiene nivelAcceso ADMIN, sube a 'administrador'. Unica fuente de verdad
  // para el rol: la usan tanto login() como refresh().
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

  private normalizeEmail(value: string): string {
    return value?.toString().trim().toLowerCase() ?? '';
  }

  private normalizeCode(value: string): string {
    return value?.toString().replace(/\D/g, '') ?? '';
  }

  private createPasswordResetCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  private hashPasswordResetCode(email: string, codigo: string): string {
    return crypto
      .createHash('sha256')
      .update(`${email}:${codigo}:${process.env.JWT_SECRET ?? 'georice'}`)
      .digest('hex');
  }

  private async findUserByEmail(email: string): Promise<ResetUserRow | null> {
    const rows = await AppDataSource.query(
      `SELECT id, email, nombre, apellido, activo
       FROM public.usuarios
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email],
    );
    return rows[0] ?? null;
  }

  private async ensurePasswordResetTable(): Promise<void> {
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS public.georice_password_reset_tokens (
        id SERIAL PRIMARY KEY,
        usuario_id TEXT NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
        codigo_hash TEXT NOT NULL,
        expira_en TIMESTAMP NOT NULL,
        usado_en TIMESTAMP NULL,
        creado_en TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await AppDataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_georice_password_reset_usuario
       ON public.georice_password_reset_tokens(usuario_id)`,
    );
    await AppDataSource.query(
      `CREATE INDEX IF NOT EXISTS idx_georice_password_reset_codigo
       ON public.georice_password_reset_tokens(codigo_hash)`,
    );
  }
}