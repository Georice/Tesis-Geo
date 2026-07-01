import { Request, Response }    from 'express';
import { IniciarCiclo }        from '../../../application/usecases/ciclos/IniciarCiclo';
import { AppDataSource }       from '../../db/DataSource';
import { CicloActividad }      from '../../../domain/entities/CicloActividad';
import { logger }              from '../../../shared/logger';

async function verifyParcelaAccess(parcelaId: number, usuarioId: string, rol: string): Promise<void> {
  if (rol === 'administrador') return;
  const result = await AppDataSource.query(
    `SELECT id FROM parcelas WHERE id = $1 AND usuario_id = $2`, [parcelaId, usuarioId]
  );
  if (!result[0]) throw new Error('Parcela no encontrada o no autorizado');
}

export class CicloController {
  async iniciar(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      const usuarioId = req.user!.sub;
      await verifyParcelaAccess(parcelaId, usuarioId, req.user!.rol);

      const { tipo, fechaInicio, variedadSemilla, areaSembrada, observaciones } = req.body;
      if (!tipo)        { res.status(400).json({ error: 'El tipo de ciclo es obligatorio' }); return; }
      if (!fechaInicio) { res.status(400).json({ error: 'La fecha de inicio es obligatoria' }); return; }

      logger.info(`POST ciclo parcela=${parcelaId}`);
      const resultado = await new IniciarCiclo().execute({
        parcelaId, tipo,
        fechaInicio: new Date(fechaInicio),
        variedadSemilla, areaSembrada, observaciones,
      });

      logger.info(`Ciclo ${resultado.ciclo.id} iniciado con ${resultado.actividades.length} actividades`);
      res.status(201).json(resultado);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar ciclo';
      logger.error('Error al iniciar ciclo:', message);
      res.status(message.includes('autorizado') ? 403 : 400).json({ error: message });
    }
  }

  async getByParcela(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      await verifyParcelaAccess(parcelaId, req.user!.sub, req.user!.rol);
      const repo   = AppDataSource.getRepository(CicloActividad);
      const ciclos = await repo.find({ where: { parcelaId }, order: { fechaInicio: 'DESC' } });
      res.json(ciclos);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener ciclos';
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }

  async finalizar(req: Request, res: Response): Promise<void> {
    try {
      const id   = Number(req.params.id);
      const repo = AppDataSource.getRepository(CicloActividad);
      const ciclo = await repo.findOne({ where: { id } });
      if (!ciclo) { res.status(404).json({ error: 'Ciclo no encontrado' }); return; }
      await verifyParcelaAccess(ciclo.parcelaId, req.user!.sub, req.user!.rol);
      ciclo.estado   = 'completado';
      ciclo.fechaFin = new Date();
      await repo.save(ciclo);
      logger.info(`Ciclo ${id} finalizado`);
      res.json(ciclo);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al finalizar ciclo';
      logger.error('Error al finalizar ciclo:', message);
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }
}