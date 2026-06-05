import { Request, Response } from 'express';
import { IniciarCiclo }      from '../../../application/usecases/ciclos/IniciarCiclo';
import { AppDataSource }     from '../../db/DataSource';
import { CicloActividad }    from '../../../domain/entities/CicloActividad';
import { logger }            from '../../../shared/logger';

export class CicloController {

  async iniciar(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      const { tipo, fechaInicio, variedadSemilla, areaSembrada, observaciones } = req.body;

      if (!tipo)        { res.status(400).json({ error: 'El tipo de ciclo es obligatorio' }); return; }
      if (!fechaInicio) { res.status(400).json({ error: 'La fecha de inicio es obligatoria' }); return; }

      logger.info(`POST /api/parcelas/${parcelaId}/ciclos → IniciarCiclo ejecutado`);

      const resultado = await new IniciarCiclo().execute({
        parcelaId,
        tipo,
        fechaInicio: new Date(fechaInicio),
        variedadSemilla,
        areaSembrada,
        observaciones,
      });

      logger.info(`✅ Ciclo ${resultado.ciclo.id} iniciado con ${resultado.actividades.length} actividades`);
      res.status(201).json(resultado);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar ciclo';
      logger.error('❌ Error al iniciar ciclo:', message);
      res.status(400).json({ error: message });
    }
  }

  async getByParcela(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      logger.info(`GET /api/parcelas/${parcelaId}/ciclos`);
      const repo   = AppDataSource.getRepository(CicloActividad);
      const ciclos = await repo.find({
        where: { parcelaId },
        order: { fechaInicio: 'DESC' },
      });
      res.json(ciclos);
    } catch (error) {
      logger.error('❌ Error al obtener ciclos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  async finalizar(req: Request, res: Response): Promise<void> {
    try {
      const id   = Number(req.params.id);
      const repo = AppDataSource.getRepository(CicloActividad);
      const ciclo = await repo.findOne({ where: { id } });
      if (!ciclo) { res.status(404).json({ error: 'Ciclo no encontrado' }); return; }
      ciclo.estado   = 'completado';
      ciclo.fechaFin = new Date();
      await repo.save(ciclo);
      logger.info(`✅ Ciclo ${id} finalizado`);
      res.json(ciclo);
    } catch (error) {
      logger.error('❌ Error al finalizar ciclo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}