import { Request, Response } from 'express';
import { AuthService } from '../../../application/services/AuthService';

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
      res.status(401).json({ error: err.message });
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
      res.status(401).json({ error: err.message });
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