import { Request, Response } from 'express';
import { AuthService } from '../../../application/services/AuthService';
import { LocalUserRepository } from '../../db/repositories/LocalUserRepository';

const authService = new AuthService(new LocalUserRepository());

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'email y password son requeridos' });
        return;
      }
      const result = await authService.login(String(email), String(password));
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
      const result = await authService.refresh(String(refreshToken));
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await authService.logout(String(refreshToken));
      res.json({ mensaje: 'Sesión cerrada' });
    } catch {
      res.json({ mensaje: 'Sesión cerrada' });
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    res.json({ usuario: req.user });
  }
}