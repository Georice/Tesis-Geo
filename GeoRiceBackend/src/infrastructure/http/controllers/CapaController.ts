import { Request, Response } from 'express';
import { CapaParcelaRepository } from '../../db/repositories/CapaParcelaRepository';
import { CreateCapa } from '../../../application/usecases/capas/CreateCapa';
import { GetCapasByParcela } from '../../../application/usecases/capas/GetCapasByParcela';
import { UpdateNdvi } from '../../../application/usecases/capas/UpdateNdvi';
import { UpdateCapaGeometry } from '../../../application/usecases/capas/UpdateCapaGeometry';
import { DeleteCapa } from '../../../application/usecases/capas/DeleteCapa';
import { logger } from '../../../shared/logger';

const repo = new CapaParcelaRepository();

export class CapaController {
  async getByParcela(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      logger.info(`GET /api/parcelas/${parcelaId}/capas → GetCapasByParcela ejecutado`);
      const capas = await new GetCapasByParcela(repo).execute(parcelaId);
      logger.info(`✅ ${capas.length} capas obtenidas para parcela ${parcelaId}`);
      res.json(capas);
    } catch (error) {
      logger.error('❌ Error al obtener capas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      logger.info(`POST /api/parcelas/${parcelaId}/capas → CreateCapa ejecutado`);
      const { tipo, geometria, ndviEstimado } = req.body;
      const capa = await new CreateCapa(repo).execute({ parcelaId, tipo, geometria, ndviEstimado });
      logger.info(`✅ Capa creada con id: ${capa.id} en parcela ${parcelaId}`);
      res.status(201).json(capa);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear capa';
      logger.error('❌ Error al crear capa:', message);
      res.status(400).json({ error: message });
    }
  }

  async updateNdvi(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      logger.info(`PUT /api/capas/${id}/ndvi → UpdateNdvi ejecutado`);
      const { ndviEstimado } = req.body;
      if (ndviEstimado === undefined) { res.status(400).json({ error: 'Se requiere ndviEstimado' }); return; }
      const capa = await new UpdateNdvi(repo).execute(id, ndviEstimado);
      if (!capa) { res.status(404).json({ error: 'Capa no encontrada' }); return; }
      logger.info(`✅ NDVI de capa ${id} actualizado a ${ndviEstimado}`);
      res.json(capa);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar NDVI';
      logger.error('❌ Error al actualizar NDVI:', message);
      res.status(400).json({ error: message });
    }
  }

  async updateGeometry(req: Request, res: Response): Promise<void> {
    try {
      const id        = Number(req.params.id);
      const parcelaId = Number(req.params.parcelaId);
      logger.info(`PUT /api/capas/${id}/geometry → UpdateCapaGeometry ejecutado`);
      const { geometria } = req.body;
      if (!geometria) { res.status(400).json({ error: 'Se requiere geometria' }); return; }
      const capa = await new UpdateCapaGeometry(repo).execute(id, parcelaId, geometria);
      if (!capa) { res.status(404).json({ error: 'Capa no encontrada' }); return; }
      logger.info(`✅ Geometría de capa ${id} actualizada`);
      res.json(capa);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar geometría';
      logger.error('❌ Error al actualizar geometría de capa:', message);
      res.status(400).json({ error: message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      logger.info(`DELETE /api/capas/${id} → DeleteCapa ejecutado`);
      const deleted = await new DeleteCapa(repo).execute(id);
      if (!deleted) { res.status(404).json({ error: 'Capa no encontrada' }); return; }
      logger.info(`✅ Capa ${id} eliminada`);
      res.json({ mensaje: 'Capa eliminada', id });
    } catch (error) {
      logger.error('❌ Error al eliminar capa:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}