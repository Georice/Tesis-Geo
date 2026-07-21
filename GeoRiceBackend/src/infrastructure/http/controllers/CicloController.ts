import { Request, Response }    from 'express';
import { IniciarCiclo }        from '../../../application/usecases/ciclos/IniciarCiclo';
import { ICicloRepository }    from '../../../domain/repositories/ICicloRepository';
import { AppDataSource }       from '../../db/DataSource';
import { logger }              from '../../../shared/logger';

const TIPOS_TODAS_FASES = ['riego', 'soca_riego'];

async function verifyParcelaAccess(parcelaId: number, usuarioId: string, rol: string): Promise<void> {
  if (rol === 'administrador') return;
  const result = await AppDataSource.query(
    `SELECT id FROM parcelas WHERE id = $1 AND usuario_id = $2`, [parcelaId, usuarioId]
  );
  if (!result[0]) throw new Error('Parcela no encontrada o no autorizado');
}

export class CicloController {
  constructor(
    private readonly cicloRepo: ICicloRepository,
    private readonly iniciarCiclo: IniciarCiclo,
  ) {}

  async iniciar(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      const usuarioId = req.user!.sub;
      await verifyParcelaAccess(parcelaId, usuarioId, req.user!.rol);

      const { tipo, fechaInicio, variedadSemilla, areaSembrada, observaciones } = req.body;
      if (!tipo)        { res.status(400).json({ error: 'El tipo de ciclo es obligatorio' }); return; }
      if (!fechaInicio) { res.status(400).json({ error: 'La fecha de inicio es obligatoria' }); return; }

      logger.info(`POST ciclo parcela=${parcelaId}`);
      const resultado = await this.iniciarCiclo.execute({
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
      const ciclos = await this.cicloRepo.findByParcela(parcelaId);
      res.json(ciclos);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener ciclos';
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }

  async finalizar(req: Request, res: Response): Promise<void> {
    try {
      const id    = Number(req.params.id);
      const ciclo = await this.cicloRepo.findById(id);
      if (!ciclo) { res.status(404).json({ error: 'Ciclo no encontrado' }); return; }
      await verifyParcelaAccess(ciclo.parcelaId, req.user!.sub, req.user!.rol);
      const actualizado = await this.cicloRepo.finalizar(id);
      logger.info(`Ciclo ${id} finalizado`);
      res.json(actualizado);
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

      await verifyParcelaAccess(parcelaId, req.user!.sub, req.user!.rol);

      // Obtener el ciclo activo de la parcela
      const cicloActivo = await this.cicloRepo.findActivoByParcela(parcelaId);

      if (!cicloActivo) {
        res.status(404).json({ error: 'No hay ciclo activo en esta parcela' });
        return;
      }

      let fases: any[];

      if (TIPOS_TODAS_FASES.includes(tipo)) {
        // Riego: mostrar TODAS las fases del ciclo
        fases = await AppDataSource.query(`
          SELECT f.codigo, f.nombre, f.orden_fase, f.orden_min AS orden_plantilla
          FROM fases_ciclo f
          WHERE f.tipo_ciclo = $1
          ORDER BY f.orden_fase
        `, [cicloActivo.tipo]);
      } else {
        // Fertilización, fumigación y otros ambiguos:
        // mostrar solo las fases donde tiene sentido ese tipo de actividad
        fases = await AppDataSource.query(`
          SELECT f.codigo, f.nombre, f.orden_fase, p.orden AS orden_plantilla
          FROM fases_ciclo f
          JOIN plantillas_ciclo p
            ON p.tipo_ciclo = f.tipo_ciclo
            AND p.orden BETWEEN f.orden_min AND f.orden_max
          WHERE f.tipo_ciclo = $1
            AND p.tipo_actividad = $2
          ORDER BY f.orden_fase
        `, [cicloActivo.tipo, tipo]);
      }

      logger.info(`GET fases-por-tipo parcela=${parcelaId} tipo=${tipo} → ${fases.length} fases`);
      res.json({ tipoCiclo: cicloActivo.tipo, fases });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener fases';
      logger.error('Error al obtener fases por tipo:', message);
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }
}
