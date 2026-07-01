import { Request, Response }          from 'express';
import { CapaParcelaRepository }      from '../../db/repositories/CapaParcelaRepository';
import { CreateCapa }                 from '../../../application/usecases/capas/CreateCapa';
import { GetCapasByParcela }          from '../../../application/usecases/capas/GetCapasByParcela';
import { UpdateNdvi }                 from '../../../application/usecases/capas/UpdateNdvi';
import { UpdateCapaGeometry }         from '../../../application/usecases/capas/UpdateCapaGeometry';
import { DeleteCapa }                 from '../../../application/usecases/capas/DeleteCapa';
import { AppDataSource }              from '../../db/DataSource';
import { logger }                     from '../../../shared/logger';

const repo = new CapaParcelaRepository();

async function verifyParcelaAccess(parcelaId: number, usuarioId: string, rol: string): Promise<void> {
  if (rol === 'administrador') return;
  const result = await AppDataSource.query(
    `SELECT id FROM parcelas WHERE id = $1 AND usuario_id = $2`, [parcelaId, usuarioId]
  );
  if (!result[0]) throw new Error('Parcela no encontrada o no autorizado');
}

export class CapaController {
  async getByParcela(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      await verifyParcelaAccess(parcelaId, req.user!.sub, req.user!.rol);
      const capas = await new GetCapasByParcela(repo).execute(parcelaId);
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
      await verifyParcelaAccess(parcelaId, usuarioId, req.user!.rol);

      const { tipo, geometria, ndviEstimado } = req.body;
      const capa = await new CreateCapa(repo).execute({
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
      const capa = await new UpdateNdvi(repo).execute(id, req.body.ndviEstimado);
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
      await verifyParcelaAccess(parcelaId, req.user!.sub, req.user!.rol);

      const { geometria } = req.body;
      if (!geometria) { res.status(400).json({ error: 'Se requiere geometria' }); return; }
      const capa = await new UpdateCapaGeometry(repo).execute(id, parcelaId, geometria);
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
      const capa = await repo.findById(id);
      if (!capa) { res.status(404).json({ error: 'Capa no encontrada' }); return; }
      await verifyParcelaAccess(capa.parcelaId, req.user!.sub, req.user!.rol);

      const deleted = await new DeleteCapa(repo).execute(id);
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