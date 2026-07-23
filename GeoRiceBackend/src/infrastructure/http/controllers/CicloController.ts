import { Request, Response }      from 'express';
import { ICicloRepository }       from '../../../domain/repositories/ICicloRepository';
import { IActividadParcelaRepository } from '../../../domain/repositories/IActividadParcelaRepository';
import { IParcelaRepository }     from '../../../domain/repositories/IParcelaRepository';
import { IniciarCiclo }           from '../../../application/usecases/ciclos/IniciarCiclo';
import { FinalizarCiclo }         from '../../../application/usecases/ciclos/FinalizarCiclo';
import { GetCiclosByParcela }     from '../../../application/usecases/ciclos/GetCiclosByParcela';
import { GetFasesPorTipo }        from '../../../application/usecases/ciclos/GetFasesPorTipo';
import { VerifyParcelaAccess }    from '../../../application/services/VerifyParcelaAccess';
import { AuthContext }            from '../../../shared/types/AuthContext';
import { logger }                 from '../../../shared/logger';

function buildCtx(req: Request): AuthContext {
  return {
    usuarioId:      req.user!.sub,
    rol:            req.user!.rol,
    nombreCompleto: `${req.user!.nombre} ${req.user!.apellido}`,
  };
}

export class CicloController {
  private readonly verifyParcelaAccess: VerifyParcelaAccess;

  constructor(
    private readonly cicloRepo: ICicloRepository,
    private readonly actividadRepo: IActividadParcelaRepository,
    parcelaRepo: IParcelaRepository,
  ) {
    this.verifyParcelaAccess = new VerifyParcelaAccess(parcelaRepo);
  }

  async iniciar(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      await this.verifyParcelaAccess.execute(parcelaId, buildCtx(req));

      const { tipo, fechaInicio, variedadSemilla, areaSembrada, observaciones } = req.body;
      if (!tipo)        { res.status(400).json({ error: 'El tipo de ciclo es obligatorio' }); return; }
      if (!fechaInicio) { res.status(400).json({ error: 'La fecha de inicio es obligatoria' }); return; }

      logger.info(`POST ciclo parcela=${parcelaId}`);
      const resultado = await new IniciarCiclo(this.cicloRepo, this.actividadRepo).execute({
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
      await this.verifyParcelaAccess.execute(parcelaId, buildCtx(req));
      const ciclos = await new GetCiclosByParcela(this.cicloRepo).execute(parcelaId);
      res.json(ciclos);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener ciclos';
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }

  async finalizar(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      // finalizar() valida pertenencia leyendo el ciclo primero: si no existe → 404
      const existing = await this.cicloRepo.findById(id);
      if (!existing) { res.status(404).json({ error: 'Ciclo no encontrado' }); return; }
      await this.verifyParcelaAccess.execute(existing.parcelaId, buildCtx(req));

      const ciclo = await new FinalizarCiclo(this.cicloRepo).execute(id);
      logger.info(`Ciclo ${id} finalizado`);
      res.json(ciclo);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al finalizar ciclo';
      logger.error('Error al finalizar ciclo:', message);
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }

  async getFasesPorTipo(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      const tipo      = req.query.tipo as string;

      if (!tipo) { res.status(400).json({ error: 'El parámetro tipo es obligatorio' }); return; }

      await this.verifyParcelaAccess.execute(parcelaId, buildCtx(req));

      const resultado = await new GetFasesPorTipo(this.cicloRepo).execute(parcelaId, tipo);
      logger.info(`GET fases-por-tipo parcela=${parcelaId} tipo=${tipo} → ${resultado.fases.length} fases`);
      res.json(resultado);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener fases';
      logger.error('Error al obtener fases por tipo:', message);
      const status = message.includes('autorizado') ? 403 : message.includes('ciclo activo') ? 404 : 500;
      res.status(status).json({ error: message });
    }
  }
}
