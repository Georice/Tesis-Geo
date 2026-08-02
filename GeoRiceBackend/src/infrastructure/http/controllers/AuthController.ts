import { Request, Response } from 'express';
import { AuthService } from '../../../application/services/AuthService';
import { logger } from '../../../shared/logger';

// Mensajes que AuthService lanza intencionalmente por reglas de negocio
// (credenciales, estado de cuenta). Cualquier otro error (fallo de DB, JWT
// mal configurado, etc.) no debe llegar al cliente con su texto original.
const LOGIN_ERRORS_CONOCIDOS = new Set([
  'Credenciales incorrectas',
  'Usuario inactivo. Contacte al administrador.',
]);
const REFRESH_ERRORS_CONOCIDOS = new Set([
  'Refresh token inválido o expirado',
  'Usuario inactivo',
]);

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, cedula, usuario, password } = req.body;
      const login = cedula ?? usuario ?? email;
      if (!login || !password) {
        res.status(400).json({ error: 'cedula/usuario y password son requeridos' });
        return;
      }
      const result = await this.authService.login(String(login), String(password));
      res.json(result);
    } catch (err: any) {
      if (LOGIN_ERRORS_CONOCIDOS.has(err.message)) {
        res.status(401).json({ error: err.message });
      } else {
        logger.error('Error inesperado en login:', err);
        res.status(500).json({ error: 'No se pudo iniciar sesión. Intenta de nuevo más tarde.' });
      }
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ error: 'refreshToken requerido' });
        return;
      }
      const result = await this.authService.refresh(String(refreshToken));
      res.json(result);
    } catch (err: any) {
      if (REFRESH_ERRORS_CONOCIDOS.has(err.message)) {
        res.status(401).json({ error: err.message });
      } else {
        logger.error('Error inesperado en refresh:', err);
        res.status(500).json({ error: 'Sesión inválida. Vuelve a iniciar sesión.' });
      }
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await this.authService.logout(String(refreshToken));
      res.json({ mensaje: 'Sesión cerrada' });
    } catch {
      res.json({ mensaje: 'Sesión cerrada' });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    res.json({ usuario: req.user });
  }
}