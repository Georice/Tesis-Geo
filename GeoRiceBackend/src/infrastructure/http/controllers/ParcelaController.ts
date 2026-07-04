import { Request, Response }        from 'express';
import { ParcelaRepository }        from '../../db/repositories/ParcelaRepository';
import { CreateParcela }            from '../../../application/usecases/parcelas/CreateParcela';
import { GetParcelas }              from '../../../application/usecases/parcelas/GetParcelas';
import { UpdateParcela }            from '../../../application/usecases/parcelas/UpdateParcela';
import { UpdateParcelaGeometry }    from '../../../application/usecases/parcelas/UpdateParcelaGeometry';
import { DeleteParcela }            from '../../../application/usecases/parcelas/DeleteParcela';
import { AuthContext }              from '../../../shared/types/AuthContext';
import { logger }                   from '../../../shared/logger';

const repo = new ParcelaRepository();

function buildCtx(req: Request): AuthContext {
  return {
    usuarioId:      req.user!.sub,
    rol:            req.user!.rol,
    nombreCompleto: `${req.user!.nombres} ${req.user!.apellidos}`,
  };
}

export class ParcelaController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const ctx      = buildCtx(req);
      const parcelas = await new GetParcelas(repo).execute(ctx);
      logger.info(`GET /api/parcelas → ${parcelas.length} parcelas (usuario=${ctx.usuarioId})`);
      res.json(parcelas);
    } catch (error) {
      logger.error('Error al obtener parcelas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const ctx     = buildCtx(req);
      const parcela = await new CreateParcela(repo).execute(req.body, ctx);
      logger.info(`POST /api/parcelas → Parcela creada id=${parcela?.id} (usuario=${ctx.usuarioId})`);
      res.status(201).json(parcela);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear parcela';
      logger.error('Error al crear parcela:', message);
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id      = Number(req.params.id);
      const ctx     = buildCtx(req);
      const parcela = await new UpdateParcela(repo).execute(id, req.body, ctx);
      if (!parcela) { res.status(404).json({ error: 'Parcela no encontrada' }); return; }
      logger.info(`PUT /api/parcelas/${id} actualizada`);
      res.json(parcela);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar parcela';
      logger.error('Error al actualizar parcela:', message);
      res.status(error instanceof Error && message.includes('autorizado') ? 403 : 400)
         .json({ error: message });
    }
  }

  async updateGeometry(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const ctx = buildCtx(req);
      const { geometria } = req.body;
      if (!geometria) { res.status(400).json({ error: 'Se requiere geometria' }); return; }
      const parcela = await new UpdateParcelaGeometry(repo).execute(id, geometria, ctx);
      if (!parcela) { res.status(404).json({ error: 'Parcela no encontrada' }); return; }
      logger.info(`PUT /api/parcelas/${id}/geometry actualizada`);
      res.json(parcela);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar geometría';
      logger.error('Error al actualizar geometría:', message);
      res.status(error instanceof Error && message.includes('autorizado') ? 403 : 400)
         .json({ error: message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id      = Number(req.params.id);
      const ctx     = buildCtx(req);
      const deleted = await new DeleteParcela(repo).execute(id, ctx);
      if (!deleted) { res.status(404).json({ error: 'Parcela no encontrada' }); return; }
      logger.info(`DELETE /api/parcelas/${id} eliminada`);
      res.json({ mensaje: 'Parcela eliminada', id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar parcela';
      logger.error('Error al eliminar parcela:', message);
      res.status(error instanceof Error && message.includes('autorizado') ? 403 : 500)
         .json({ error: message });
    }
  }
}
