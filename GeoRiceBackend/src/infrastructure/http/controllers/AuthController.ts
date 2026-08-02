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
  'Refresh token invalido o expirado',
  'Usuario inactivo',
]);
const RESET_ERRORS_CONOCIDOS = new Set([
  'Correo y codigo son requeridos',
  'La contrasena debe tener al menos 8 caracteres',
  'Codigo de recuperacion invalido o expirado',
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
        res.status(500).json({ error: 'No se pudo iniciar sesion. Intenta de nuevo mas tarde.' });
      }
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'El correo es requerido' });
        return;
      }
      const result = await this.authService.forgotPassword(String(email));
      res.json({ mensaje: result.mensaje, resetCode: result.resetCode });
    } catch (err: any) {
      logger.error('Error inesperado en recuperacion de contrasena:', err);
      res.status(500).json({ error: 'No se pudo enviar el codigo. Intenta de nuevo mas tarde.' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, codigo, code, token, password, newPassword, new_password } = req.body;
      const cleanCode = codigo ?? code ?? token;
      const cleanPassword = password ?? newPassword ?? new_password;
      const result = await this.authService.resetPassword(
        String(email ?? ''),
        String(cleanCode ?? ''),
        String(cleanPassword ?? ''),
      );
      res.json(result);
    } catch (err: any) {
      if (RESET_ERRORS_CONOCIDOS.has(err.message)) {
        res.status(400).json({ error: err.message });
      } else {
        logger.error('Error inesperado al cambiar contrasena:', err);
        res.status(500).json({ error: 'No se pudo cambiar la contrasena. Intenta de nuevo mas tarde.' });
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
        res.status(500).json({ error: 'Sesion invalida. Vuelve a iniciar sesion.' });
      }
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await this.authService.logout(String(refreshToken));
      res.json({ mensaje: 'Sesion cerrada' });
    } catch {
      res.json({ mensaje: 'Sesion cerrada' });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    res.json({ usuario: req.user });
  }
}