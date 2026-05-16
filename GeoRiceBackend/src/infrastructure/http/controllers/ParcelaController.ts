import { Request, Response } from 'express';
import { ParcelaRepository } from '../../db/repositories/ParcelaRepository';
import { CreateParcela } from '../../../application/usecases/parcelas/CreateParcela';
import { GetParcelas } from '../../../application/usecases/parcelas/GetParcelas';
import { UpdateParcela } from '../../../application/usecases/parcelas/UpdateParcela';
import { UpdateParcelaGeometry } from '../../../application/usecases/parcelas/UpdateParcelaGeometry';
import { DeleteParcela } from '../../../application/usecases/parcelas/DeleteParcela';
import { logger } from '../../../shared/logger';

const repo = new ParcelaRepository();

export class ParcelaController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      logger.info('GET /api/parcelas → GetParcelas ejecutado');
      const parcelas = await new GetParcelas(repo).execute();
      logger.info(`✅ ${parcelas.length} parcelas obtenidas`);
      res.json(parcelas);
    } catch (error) {
      logger.error('❌ Error al obtener parcelas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      logger.info('POST /api/parcelas → CreateParcela ejecutado');
      const { nombre, propietario, cultivo, geometria, estado, zonaId } = req.body;
      const parcela = await new CreateParcela(repo).execute({ nombre, propietario, cultivo, geometria, estado, zonaId });
      logger.info(`✅ Parcela creada con id: ${parcela.id}`);
      res.status(201).json(parcela);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear parcela';
      logger.error('❌ Error al crear parcela:', message);
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      logger.info(`PUT /api/parcelas/${id} → UpdateParcela ejecutado`);
      const { nombre, propietario, cultivo, estado, zonaId } = req.body;
      const parcela = await new UpdateParcela(repo).execute(id, { nombre, propietario, cultivo, estado, zonaId });
      if (!parcela) { res.status(404).json({ error: 'Parcela no encontrada' }); return; }
      logger.info(`✅ Parcela ${id} actualizada`);
      res.json(parcela);
    } catch (error) {
      logger.error('❌ Error al actualizar parcela:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async updateGeometry(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      logger.info(`PUT /api/parcelas/${id}/geometry → UpdateParcelaGeometry ejecutado`);
      const { geometria } = req.body;
      if (!geometria) { res.status(400).json({ error: 'Se requiere geometria' }); return; }
      const parcela = await new UpdateParcelaGeometry(repo).execute(id, geometria);
      if (!parcela) { res.status(404).json({ error: 'Parcela no encontrada' }); return; }
      logger.info(`✅ Geometría de parcela ${id} actualizada`);
      res.json(parcela);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar geometría';
      logger.error('❌ Error al actualizar geometría:', message);
      res.status(400).json({ error: message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      logger.info(`DELETE /api/parcelas/${id} → DeleteParcela ejecutado`);
      const deleted = await new DeleteParcela(repo).execute(id);
      if (!deleted) { res.status(404).json({ error: 'Parcela no encontrada' }); return; }
      logger.info(`✅ Parcela ${id} eliminada`);
      res.json({ mensaje: 'Parcela eliminada', id });
    } catch (error) {
      logger.error('❌ Error al eliminar parcela:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}