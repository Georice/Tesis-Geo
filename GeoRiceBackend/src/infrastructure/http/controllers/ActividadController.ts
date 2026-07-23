import { Request, Response }             from 'express';
import { IActividadParcelaRepository }   from '../../../domain/repositories/IActividadParcelaRepository';
import { ICicloRepository }              from '../../../domain/repositories/ICicloRepository';
import { IParcelaRepository }            from '../../../domain/repositories/IParcelaRepository';
import { CreateActividad }               from '../../../application/usecases/actividades/CreateActividad';
import { GetActividadesByParcela }       from '../../../application/usecases/actividades/GetActividadesByParcela';
import { UpdateActividad }               from '../../../application/usecases/actividades/UpdateActividad';
import { DeleteActividad }               from '../../../application/usecases/actividades/DeleteActividad';
import { VerifyParcelaAccess }           from '../../../application/services/VerifyParcelaAccess';
import { AuthContext }                   from '../../../shared/types/AuthContext';
import { logger }                        from '../../../shared/logger';

function buildCtx(req: Request): AuthContext {
  return {
    usuarioId:      req.user!.sub,
    rol:            req.user!.rol,
    nombreCompleto: `${req.user!.nombre} ${req.user!.apellido}`,
  };
}

export class ActividadController {
  private readonly verifyParcelaAccess: VerifyParcelaAccess;

  constructor(
    private readonly repo: IActividadParcelaRepository,
    private readonly cicloRepo: ICicloRepository,
    private readonly parcelaRepo: IParcelaRepository,
  ) {
    this.verifyParcelaAccess = new VerifyParcelaAccess(parcelaRepo);
  }

  async getByParcela(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      await this.verifyParcelaAccess.execute(parcelaId, buildCtx(req));
      const page     = req.query.page ? Number(req.query.page) : undefined;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

      const resultado = await new GetActividadesByParcela(this.repo, this.cicloRepo).execute(parcelaId, page, pageSize);
      logger.info(`GET actividades parcela=${parcelaId} → ${resultado.total} totales`);
      res.json(resultado);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener actividades';
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      const usuarioId = req.user!.sub;
      await this.verifyParcelaAccess.execute(parcelaId, buildCtx(req));

      const {
        tipo, estado, fecha, fechaInicio, fechaFin,
        metodo, insumo, cantidad, unidad,
        nivelAlerta, observaciones, capaId, cicloId,
        ordenPlantilla, productos,
        detalleRiego, detalleFumigacion, detalleFertilizacion,
        detalleCosecha, detalleManoObra, detalleMaquinaria,
      } = req.body;

      const actividad = await new CreateActividad(this.repo, this.cicloRepo, this.parcelaRepo).execute({
        parcelaId, tipo, estado, fecha, fechaInicio, fechaFin,
        metodo, insumo, cantidad, unidad,
        nivelAlerta, observaciones, capaId, cicloId,
        ordenPlantilla, productos,
        detalleRiego, detalleFumigacion, detalleFertilizacion,
        detalleCosecha, detalleManoObra, detalleMaquinaria,
        createdBy: usuarioId, updatedBy: usuarioId,
      });

      logger.info(`POST actividad creada id=${actividad.id} parcela=${parcelaId}`);
      res.status(201).json(actividad);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear actividad';
      logger.error('Error al crear actividad:', message);
      res.status(message.includes('autorizado') ? 403 : 400).json({ error: message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id        = Number(req.params.id);
      const usuarioId = req.user!.sub;

      const existing = await this.repo.findById(id);
      if (!existing) { res.status(404).json({ error: 'Actividad no encontrada' }); return; }
      await this.verifyParcelaAccess.execute(existing.parcelaId, buildCtx(req));

      const {
        tipo, estado, fecha, fechaInicio, fechaFin,
        metodo, insumo, cantidad, unidad,
        nivelAlerta, observaciones, capaId,
        ordenPlantilla, productos,
        detalleRiego, detalleFumigacion, detalleFertilizacion,
        detalleCosecha, detalleManoObra, detalleMaquinaria,
      } = req.body;

      const actividad = await new UpdateActividad(this.repo, this.parcelaRepo).execute(id, {
        tipo, estado, fecha, fechaInicio, fechaFin,
        metodo, insumo, cantidad, unidad,
        nivelAlerta, observaciones, capaId,
        ordenPlantilla, productos,
        detalleRiego, detalleFumigacion, detalleFertilizacion,
        detalleCosecha, detalleManoObra, detalleMaquinaria,
        updatedBy: usuarioId,
      });

      logger.info(`PUT actividad ${id} actualizada`);
      res.json(actividad);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar actividad';
      logger.error('Error al actualizar actividad:', message);
      res.status(message.includes('autorizado') ? 403 : 400).json({ error: message });
    }
  }

  async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      const existing = await this.repo.findById(id);
      if (!existing) { res.status(404).json({ error: 'Actividad no encontrada' }); return; }
      await this.verifyParcelaAccess.execute(existing.parcelaId, buildCtx(req));

      const deleted = await new DeleteActividad(this.repo).execute(id);
      if (!deleted) { res.status(404).json({ error: 'Actividad no encontrada' }); return; }
      logger.info(`DELETE actividad ${id} eliminada`);
      res.json({ mensaje: 'Actividad eliminada', id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar actividad';
      logger.error('Error al eliminar actividad:', message);
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }
}