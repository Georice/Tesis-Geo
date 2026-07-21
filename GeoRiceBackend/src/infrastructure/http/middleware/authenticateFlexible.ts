import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../../application/services/AuthService';
import { AppDataSource } from '../../db/DataSource';

// Igual que `authenticate`, pero además acepta el token vía ?token= en el
// query string. Necesario para los endpoints de descarga (/reportes/export/*)
// que se abren con Linking.openURL en el navegador del dispositivo, el cual
// no puede enviar el header Authorization.
export async function authenticateFlexible(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token  = header?.startsWith('Bearer ')
    ? header.slice(7)
    : (typeof req.query.token === 'string' ? req.query.token : null);

  if (!token) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const rows = await AppDataSource.query(
      `SELECT id FROM public.usuarios WHERE id = $1 AND estado = 'activo' LIMIT 1`,
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
