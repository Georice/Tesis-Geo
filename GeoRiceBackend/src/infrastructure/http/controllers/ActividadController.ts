import { Request, Response }             from 'express';
import { ActividadParcelaRepository }    from '../../db/repositories/ActividadParcelaRepository';
import { CreateActividad }               from '../../../application/usecases/actividades/CreateActividad';
import { GetActividadesByParcela }       from '../../../application/usecases/actividades/GetActividadesByParcela';
import { UpdateActividad }               from '../../../application/usecases/actividades/UpdateActividad';
import { DeleteActividad }               from '../../../application/usecases/actividades/DeleteActividad';
import { AppDataSource }                 from '../../db/DataSource';
import { logger }                        from '../../../shared/logger';

const repo = new ActividadParcelaRepository();

async function verifyParcelaAccess(parcelaId: number, usuarioId: number, rol: string): Promise<void> {
  if (rol === 'administrador') return;
  const result = await AppDataSource.query(
    `SELECT id FROM parcelas WHERE id = $1 AND usuario_id = $2`, [parcelaId, usuarioId]
  );
  if (!result[0]) throw new Error('Parcela no encontrada o no autorizado');
}

export class ActividadController {
  async getByParcela(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      await verifyParcelaAccess(parcelaId, Number(req.user!.sub), req.user!.rol);
      const actividades = await new GetActividadesByParcela(repo).execute(parcelaId);
      logger.info(`GET actividades parcela=${parcelaId} → ${actividades.length}`);
      res.json(actividades);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener actividades';
      res.status(message.includes('autorizado') ? 403 : 500).json({ error: message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const parcelaId = Number(req.params.parcelaId);
      const usuarioId = Number(req.user!.sub);
      await verifyParcelaAccess(parcelaId, usuarioId, req.user!.rol);

      const {
        tipo, estado, fecha, fechaInicio, fechaFin,
        metodo, insumo, cantidad, unidad,
        laminaAgua, rendimientoHa, totalSacos, humedad,
        precioQq, costoCosecha, destino,
        plagaDetectada, nivelDano, nivelAlerta,
        capacidadTanque, numTanques,
        // mano de obra legacy
        numJornales, pagoJornal, costoManoObra,
        // mano de obra nuevo modelo
        unidadManoObra, cantidadUnidadMo, precioUnidadMo,
        numTrabajadores, descripcionUnidadMo,
        // maquinaria
        tipoMaquinaria, unidadCobro, cantidadUnidades,
        costoPorUnidad, costoMaquinaria,
        // sembradores trasplante
        numTareas, precioTarea, costoSembradores,
        // costos calculados
        costoInsumos, costoTotalActividad,
        // otros
        observaciones, capaId, cicloId, productos,
      } = req.body;

      const actividad = await new CreateActividad(repo).execute({
        parcelaId, tipo, estado, fecha, fechaInicio, fechaFin,
        metodo, insumo, cantidad, unidad,
        laminaAgua, rendimientoHa, totalSacos, humedad,
        precioQq, costoCosecha, destino,
        plagaDetectada, nivelDano, nivelAlerta,
        capacidadTanque, numTanques,
        numJornales, pagoJornal, costoManoObra,
        unidadManoObra, cantidadUnidadMo, precioUnidadMo,
        numTrabajadores, descripcionUnidadMo,
        tipoMaquinaria, unidadCobro, cantidadUnidades,
        costoPorUnidad, costoMaquinaria,
        numTareas, precioTarea, costoSembradores,
        costoInsumos, costoTotalActividad,
        observaciones, capaId, cicloId,
        createdBy: usuarioId, updatedBy: usuarioId,
        productos,
      } as any);

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
      const usuarioId = Number(req.user!.sub);

      const existing = await repo.findById(id);
      if (!existing) { res.status(404).json({ error: 'Actividad no encontrada' }); return; }
      await verifyParcelaAccess(existing.parcelaId, usuarioId, req.user!.rol);

      const {
        tipo, estado, fecha, fechaInicio, fechaFin,
        metodo, insumo, cantidad, unidad,
        laminaAgua, rendimientoHa, totalSacos, humedad,
        precioQq, costoCosecha, destino,
        plagaDetectada, nivelDano, nivelAlerta,
        capacidadTanque, numTanques,
        // mano de obra legacy
        numJornales, pagoJornal, costoManoObra,
        // mano de obra nuevo modelo
        unidadManoObra, cantidadUnidadMo, precioUnidadMo,
        numTrabajadores, descripcionUnidadMo,
        // maquinaria
        tipoMaquinaria, unidadCobro, cantidadUnidades,
        costoPorUnidad, costoMaquinaria,
        // sembradores trasplante
        numTareas, precioTarea, costoSembradores,
        // costos calculados
        costoInsumos, costoTotalActividad,
        // otros
        observaciones, capaId, productos,
      } = req.body;

      const actividad = await new UpdateActividad(repo).execute(id, {
        tipo, estado, fecha, fechaInicio, fechaFin,
        metodo, insumo, cantidad, unidad,
        laminaAgua, rendimientoHa, totalSacos, humedad,
        precioQq, costoCosecha, destino,
        plagaDetectada, nivelDano, nivelAlerta,
        capacidadTanque, numTanques,
        numJornales, pagoJornal, costoManoObra,
        unidadManoObra, cantidadUnidadMo, precioUnidadMo,
        numTrabajadores, descripcionUnidadMo,
        tipoMaquinaria, unidadCobro, cantidadUnidades,
        costoPorUnidad, costoMaquinaria,
        numTareas, precioTarea, costoSembradores,
        costoInsumos, costoTotalActividad,
        observaciones, capaId,
        updatedBy: usuarioId,
        productos,
      } as any);

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
      const id        = Number(req.params.id);
      const usuarioId = Number(req.user!.sub);

      const existing = await repo.findById(id);
      if (!existing) { res.status(404).json({ error: 'Actividad no encontrada' }); return; }
      await verifyParcelaAccess(existing.parcelaId, usuarioId, req.user!.rol);

      const deleted = await new DeleteActividad(repo).execute(id);
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