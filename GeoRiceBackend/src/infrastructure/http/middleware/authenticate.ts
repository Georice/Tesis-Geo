import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../../application/services/AuthService';
import { AppDataSource } from '../../db/DataSource';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Verifica contra public.usuarios de MagnaRice.
    // MagnaRice usa boolean "activo", no varchar "estado".
    const rows = await AppDataSource.query(
      `SELECT id FROM public.usuarios WHERE id = $1 AND activo = true LIMIT 1`,
      [payload.sub],
    );
    if (!rows[0]) {
      res.status(401).json({ error: 'Sesión inválida' });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}