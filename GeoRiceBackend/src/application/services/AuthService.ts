import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { AppDataSource } from '../../infrastructure/db/DataSource';
import { RefreshToken } from '../../domain/entities/RefreshToken';

export interface JwtPayload {
  sub:       string;
  cedula:    string;
  rol:       'administrador' | 'socio';
  nombres:   string;
  apellidos: string;
}

export class AuthService {
  private refreshRepo = AppDataSource.getRepository(RefreshToken);

  constructor(private readonly userRepo: IUserRepository) {}

  async login(usuario: string, password: string) {
    const user = await this.userRepo.findByUsuario(usuario);
    if (!user) throw new Error('Credenciales incorrectas');
    if (user.estado !== 'activo') throw new Error('Usuario inactivo. Contacte al administrador.');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Credenciales incorrectas');

    const payload: JwtPayload = {
      sub:       String(user.id),
      cedula:    user.cedula,
      rol:       user.rol as 'administrador' | 'socio',
      nombres:   user.nombres,
      apellidos: user.apellidos,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const { refreshToken, tokenHash, expiresAt } = this.generateRefreshToken();

    await this.refreshRepo.save(
      this.refreshRepo.create({ usuarioId: user.id, tokenHash, expiresAt })
    );

    return { accessToken, refreshToken, usuario: payload };
  }

  async refresh(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const record = await this.refreshRepo.findOne({
      where: { tokenHash, revocado: false },
      relations: ['usuario'],
    });

    if (!record || record.expiresAt < new Date()) {
      throw new Error('Refresh token inválido o expirado');
    }
    if (record.usuario.estado !== 'activo') {
      throw new Error('Usuario inactivo');
    }

    await this.refreshRepo.update(record.id, { revocado: true });

    const payload: JwtPayload = {
      sub:       String(record.usuario.id),
      cedula:    record.usuario.cedula,
      rol:       record.usuario.rol,
      nombres:   record.usuario.nombres,
      apellidos: record.usuario.apellidos,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const { refreshToken, tokenHash: newHash, expiresAt: newExpires } = this.generateRefreshToken();

    await this.refreshRepo.save(
      this.refreshRepo.create({ usuarioId: record.usuario.id, tokenHash: newHash, expiresAt: newExpires })
    );

    return { accessToken, refreshToken };
  }

  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshRepo.update({ tokenHash }, { revocado: true });
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
