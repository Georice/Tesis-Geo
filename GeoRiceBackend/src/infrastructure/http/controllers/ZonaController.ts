import { Request, Response } from 'express';
import { ZonaRepository } from '../../db/repositories/ZonaRepository';
import { CreateZona } from '../../../application/usecases/zonas/CreateZonas';
import { GetZonas } from '../../../application/usecases/zonas/GetZonas';
import { UpdateZona } from '../../../application/usecases/zonas/UpdateZona';
import { DeleteZona } from '../../../application/usecases/zonas/DeleteZona';
import { logger } from '../../../shared/logger';

const repo = new ZonaRepository();

export class ZonaController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      logger.info('GET /api/zonas → GetZonas ejecutado');
      const zonas = await new GetZonas(repo).execute();
      logger.info(`✅ ${zonas.length} zonas obtenidas`);
      res.json(zonas);
    } catch (error) {
      logger.error('❌ Error al obtener zonas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      logger.info('POST /api/zonas → CreateZona ejecutado');
      const { nombre, descripcion, geometria } = req.body;
      const zona = await new CreateZona(repo).execute({ nombre, descripcion, geometria });
      logger.info(`✅ Zona creada con id: ${zona.id}`);
      res.status(201).json(zona);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear zona';
      logger.error('❌ Error al crear zona:', message);
      res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      logger.info(`PUT /api/zonas/${id} → UpdateZona ejecutado`);
      const { nombre, descripcion, geometria } = req.body;
      const zona = await new UpdateZona(repo).execute(id, { nombre, descripcion, geometria });
      if (!zona) { res.status(404).json({ error: 'Zona no encontrada' }); return; }
      logger.info(`✅ Zona ${id} actualizada`);
      res.json(zona);
    } catch (error) {
      logger.error('❌ Error al actualizar zona:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      logger.info(`DELETE /api/zonas/${id} → DeleteZona ejecutado`);
      const deleted = await new DeleteZona(repo).execute(id);
      if (!deleted) { res.status(404).json({ error: 'Zona no encontrada' }); return; }
      logger.info(`✅ Zona ${id} eliminada`);
      res.json({ mensaje: 'Zona eliminada', id });
    } catch (error) {
      logger.error('❌ Error al eliminar zona:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}