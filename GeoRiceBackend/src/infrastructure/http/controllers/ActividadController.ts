import { Request, Response } from 'express';
import { ActividadParcelaRepository } from '../../db/repositories/ActividadParcelaRepository';
import { CreateActividad } from '../../../application/usecases/actividades/CreateActividad';
import { GetActividadesByParcela } from '../../../application/usecases/actividades/GetActividadesByParcela';
import { UpdateActividad } from '../../../application/usecases/actividades/UpdateActividad';
import { DeleteActividad } from '../../../application/usecases/actividades/DeleteActividad';
import { logger } from '../../../shared/logger';

const repo = new ActividadParcelaRepository();

export class ActividadController {
  async getByParcela(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      logger.info(`GET /api/parcelas/${parcelaId}/actividades → GetActividadesByParcela ejecutado`);
      const actividades = await new GetActividadesByParcela(repo).execute(parcelaId);
      logger.info(`✅ ${actividades.length} actividades obtenidas para parcela ${parcelaId}`);
      res.json(actividades);
    } catch (error) {
      logger.error('❌ Error al obtener actividades:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      logger.info(`POST /api/parcelas/${parcelaId}/actividades → CreateActividad ejecutado`);
      const { tipo, fecha, insumo, cantidad, unidad, rendimientoHa, observaciones, capaId } = req.body;
      const actividad = await new CreateActividad(repo).execute({ parcelaId, tipo, fecha, insumo, cantidad, unidad, rendimientoHa, observaciones, capaId });
      logger.info(`✅ Actividad creada con id: ${actividad.id}`);
      res.status(201).json(actividad);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear actividad';
      logger.error('❌ Error al crear actividad:', message);
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      logger.info(`PUT /api/actividades/${id} → UpdateActividad ejecutado`);
      const actividad = await new UpdateActividad(repo).execute(id, req.body);
      if (!actividad) { res.status(404).json({ error: 'Actividad no encontrada' }); return; }
      logger.info(`✅ Actividad ${id} actualizada`);
      res.json(actividad);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar actividad';
      logger.error('❌ Error al actualizar actividad:', message);
      res.status(400).json({ error: message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      logger.info(`DELETE /api/actividades/${id} → DeleteActividad ejecutado`);
      const deleted = await new DeleteActividad(repo).execute(id);
      if (!deleted) { res.status(404).json({ error: 'Actividad no encontrada' }); return; }
      logger.info(`✅ Actividad ${id} eliminada`);
      res.json({ mensaje: 'Actividad eliminada', id });
    } catch (error) {
      logger.error('❌ Error al eliminar actividad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}