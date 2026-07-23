import { Request, Response }          from 'express';
import { ICapaParcelaRepository }     from '../../../domain/repositories/ICapaParcelaRepository';
import { IParcelaRepository }         from '../../../domain/repositories/IParcelaRepository';
import { CreateCapa }                 from '../../../application/usecases/capas/CreateCapa';
import { GetCapasByParcela }          from '../../../application/usecases/capas/GetCapasByParcela';
import { UpdateNdvi }                 from '../../../application/usecases/capas/UpdateNdvi';
import { UpdateCapaGeometry }         from '../../../application/usecases/capas/UpdateCapaGeometry';
import { DeleteCapa }                 from '../../../application/usecases/capas/DeleteCapa';
import { VerifyParcelaAccess }        from '../../../application/services/VerifyParcelaAccess';
import { AuthContext }                from '../../../shared/types/AuthContext';
import { logger }                     from '../../../shared/logger';

function buildCtx(req: Request): AuthContext {
  return {
    usuarioId:      req.user!.sub,
    rol:            req.user!.rol,
    nombreCompleto: `${req.user!.nombre} ${req.user!.apellido}`,
  };
}

export class CapaController {
  private readonly verifyParcelaAccess: VerifyParcelaAccess;

  constructor(
    private readonly repo: ICapaParcelaRepository,
    parcelaRepo: IParcelaRepository,
  ) {
    this.verifyParcelaAccess = new VerifyParcelaAccess(parcelaRepo);
  }

  async getByParcela(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      await this.verifyParcelaAccess.execute(parcelaId, buildCtx(req));
      const capas = await new GetCapasByParcela(this.repo).execute(parcelaId);
      logger.info(`GET capas parcela=${parcelaId} → ${capas.length}`);
      res.json(capas);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener capas';
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      const usuarioId = req.user!.sub;
      await this.verifyParcelaAccess.execute(parcelaId, buildCtx(req));

      const { tipo, geometria, ndviEstimado } = req.body;
      const capa = await new CreateCapa(this.repo).execute({
        parcelaId, tipo, geometria, ndviEstimado,
        createdBy: usuarioId, updatedBy: usuarioId,
      });
      logger.info(`POST capa creada id=${capa.id} parcela=${parcelaId}`);
      res.status(201).json(capa);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear capa';
      logger.error('Error al crear capa:', message);
      res.status(message.includes('autorizado') ? 403 : 400).json({ error: message });
    }
  }

  async updateNdvi(req: Request, res: Response): Promise<void> {
    try {
      const id   = Number(req.params.id);
      const capa = await new UpdateNdvi(this.repo).execute(id, req.body.ndviEstimado);
      if (!capa) { res.status(404).json({ error: 'Capa no encontrada' }); return; }
      logger.info(`PUT capa ${id} NDVI actualizado`);
      res.json(capa);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar NDVI';
      res.status(400).json({ error: message });
    }
  }

  async updateGeometry(req: Request, res: Response): Promise<void> {
    try {
      const id        = Number(req.params.id);
      const parcelaId = Number(req.params.parcelaId);
      await this.verifyParcelaAccess.execute(parcelaId, buildCtx(req));

      const { geometria } = req.body;
      if (!geometria) { res.status(400).json({ error: 'Se requiere geometria' }); return; }
      const capa = await new UpdateCapaGeometry(this.repo).execute(id, parcelaId, geometria);
      if (!capa) { res.status(404).json({ error: 'Capa no encontrada' }); return; }
      logger.info(`PUT capa ${id} geometría actualizada`);
      res.json(capa);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar geometría de capa';
      logger.error('Error al actualizar geometría de capa:', message);
      res.status(message.includes('autorizado') ? 403 : 400).json({ error: message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id   = Number(req.params.id);
      const capa = await this.repo.findById(id);
      if (!capa) { res.status(404).json({ error: 'Capa no encontrada' }); return; }
      await this.verifyParcelaAccess.execute(capa.parcelaId, buildCtx(req));

      const deleted = await new DeleteCapa(this.repo).execute(id);
      if (!deleted) { res.status(404).json({ error: 'Capa no encontrada' }); return; }
      logger.info(`DELETE capa ${id} eliminada`);
      res.json({ mensaje: 'Capa eliminada', id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar capa';
      logger.error('Error al eliminar capa:', message);
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }
}
