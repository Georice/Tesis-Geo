import { Request, Response } from 'express';
import { SyncRepository } from '../../db/repositories/SyncRepository';
import { GetSyncData } from '../../../application/usecases/sync/GetSyncData';
import { AuthContext } from '../../../shared/types/AuthContext';
import { logger } from '../../../shared/logger';

const repo = new SyncRepository();

export class SyncController {
  // GET /api/sync            → descarga completa
  // GET /api/sync?since=ISO  → descarga incremental
  async syncData(req: Request, res: Response): Promise<void> {
    const ctx: AuthContext = {
      usuarioId:      req.user!.sub,
      rol:            req.user!.rol,
      nombreCompleto: `${req.user!.nombre} ${req.user!.apellido}`,
    };

    const sinceRaw = req.query.since as string | undefined;
    let sinceDate: Date | null = null;

    if (sinceRaw) {
      sinceDate = new Date(sinceRaw);
      if (isNaN(sinceDate.getTime())) {
        res.status(400).json({ error: 'Parámetro since inválido. Use formato ISO8601.' });
        return;
      }
    }

    try {
      logger.info(`GET /api/sync → usuario=${ctx.usuarioId} rol=${ctx.rol} incremental=${!!sinceDate}`);
      const resultado = await new GetSyncData(repo).execute(ctx, sinceDate);
      res.json(resultado);
    } catch (err: any) {
      logger.error('Error en sync:', err);
      res.status(500).json({ error: err.message });
    }
  }
}
