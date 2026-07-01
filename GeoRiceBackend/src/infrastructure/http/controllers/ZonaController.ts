import { Request, Response }    from 'express';
import { ZonaRepository }       from '../../db/repositories/ZonaRepository';
import { CreateZona }           from '../../../application/usecases/zonas/CreateZonas';
import { GetZonas }             from '../../../application/usecases/zonas/GetZonas';
import { UpdateZona }           from '../../../application/usecases/zonas/UpdateZona';
import { DeleteZona }           from '../../../application/usecases/zonas/DeleteZona';
import { AuthContext }          from '../../../shared/types/AuthContext';
import { logger }               from '../../../shared/logger';

const repo = new ZonaRepository();

function buildCtx(req: Request): AuthContext {
  return {
    usuarioId:      req.user!.sub,
    rol:            req.user!.rol,
    nombreCompleto: `${req.user!.nombres} ${req.user!.apellidos}`,
  };
}

export class ZonaController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const ctx   = buildCtx(req);
      const zonas = await new GetZonas(repo).execute(ctx);
      logger.info(`GET /api/zonas → ${zonas.length} zonas (usuario=${ctx.usuarioId})`);
      res.json(zonas);
    } catch (error) {
      logger.error('Error al obtener zonas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const ctx  = buildCtx(req);
      const zona = await new CreateZona(repo).execute(req.body, ctx);
      logger.info(`POST /api/zonas → Zona creada id=${zona?.id}`);
      res.status(201).json(zona);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear zona';
      logger.error('Error al crear zona:', message);
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id   = Number(req.params.id);
      const ctx  = buildCtx(req);
      const zona = await new UpdateZona(repo).execute(id, req.body, ctx);
      if (!zona) { res.status(404).json({ error: 'Zona no encontrada' }); return; }
      logger.info(`PUT /api/zonas/${id} actualizada`);
      res.json(zona);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar zona';
      logger.error('Error al actualizar zona:', message);
      res.status(error instanceof Error && message.includes('autorizado') ? 403 : 400)
         .json({ error: message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id      = Number(req.params.id);
      const ctx     = buildCtx(req);
      const deleted = await new DeleteZona(repo).execute(id, ctx);
      if (!deleted) { res.status(404).json({ error: 'Zona no encontrada' }); return; }
      logger.info(`DELETE /api/zonas/${id} eliminada`);
      res.json({ mensaje: 'Zona eliminada', id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar zona';
      logger.error('Error al eliminar zona:', message);
      res.status(error instanceof Error && message.includes('autorizado') ? 403 : 500)
         .json({ error: message });
    }
  }
}
