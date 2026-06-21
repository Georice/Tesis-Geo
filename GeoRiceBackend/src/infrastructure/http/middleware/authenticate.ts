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

    // Verificar que el usuario aún existe y está activo en BD.
    // Evita que tokens válidos de sesiones cuya BD fue recreada produzcan
    // errores de FK en los controladores en lugar de 401.
    const rows = await AppDataSource.query(
      `SELECT id FROM usuarios WHERE id = $1 AND estado = 'activo' LIMIT 1`,
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
