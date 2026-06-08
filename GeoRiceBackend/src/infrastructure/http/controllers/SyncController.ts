import { Request, Response } from 'express';
import { AppDataSource } from '../../db/DataSource';
import { AuthContext } from '../../../shared/types/AuthContext';
import { logger } from '../../../shared/logger';

export class SyncController {
  // GET /api/sync            → descarga completa
  // GET /api/sync?since=ISO  → descarga incremental
  async syncData(req: Request, res: Response): Promise<void> {
    const ctx: AuthContext = {
      usuarioId:      Number(req.user!.sub),
      rol:            req.user!.rol,
      nombreCompleto: `${req.user!.nombres} ${req.user!.apellidos}`,
    };

    const sinceRaw = req.query.since as string | undefined;
    let sinceDate: Date | null = null;

    if (sinceRaw) {
      sinceDate = new Date(sinceRaw);
      if (isNaN(sinceDate.getTime())) {
        res.status(400).json({ error: 'Parámetro since inválido. Use formato ISO8601.' });
        return;
      }
    }

    try {
      logger.info(`GET /api/sync → usuario=${ctx.usuarioId} rol=${ctx.rol} incremental=${!!sinceDate}`);

      const [parcelas, zonas, capas, actividades, ciclos, productos] = await Promise.all([
        this.queryParcelas(ctx, sinceDate),
        this.queryZonas(ctx, sinceDate),
        this.queryCapas(ctx, sinceDate),
        this.queryActividades(ctx, sinceDate),
        this.queryCiclos(ctx, sinceDate),
        this.queryProductos(ctx, sinceDate),
      ]);

      res.json({
        timestamp:   new Date().toISOString(),
        incremental: !!sinceDate,
        since:       sinceDate?.toISOString() ?? null,
        usuarioId:   ctx.usuarioId,
        rol:         ctx.rol,
        parcelas,
        zonas,
        capas,
        actividades,
        ciclos,
        productos,
      });
    } catch (err: any) {
      logger.error('Error en sync:', err);
      res.status(500).json({ error: err.message });
    }
  }

  private buildConditions(ctx: AuthContext, sinceDate: Date | null, alias: string, userCol: string): { where: string; params: any[] } {
    const conds: string[] = [];
    const params: any[]   = [];

    if (ctx.rol !== 'administrador') {
      params.push(ctx.usuarioId);
      conds.push(`${alias}.${userCol} = $${params.length}`);
    }
    if (sinceDate) {
      params.push(sinceDate.toISOString());
      conds.push(`${alias}.updated_at > $${params.length}`);
    }

    return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
  }

  private buildJoinConditions(ctx: AuthContext, sinceDate: Date | null, alias: string): { where: string; params: any[] } {
    const conds: string[] = [];
    const params: any[]   = [];

    if (ctx.rol !== 'administrador') {
      params.push(ctx.usuarioId);
      conds.push(`p.usuario_id = $${params.length}`);
    }
    if (sinceDate) {
      params.push(sinceDate.toISOString());
      conds.push(`${alias}.updated_at > $${params.length}`);
    }

    return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
  }

  private async queryParcelas(ctx: AuthContext, since: Date | null) {
    const { where, params } = this.buildConditions(ctx, since, 'p', 'usuario_id');
    return AppDataSource.query(`
      SELECT p.id, p.nombre, p.usuario_id AS "usuarioId",
             p.propietario, p.cultivo, p.estado,
             p.zona_id AS "zonaId", p.ciclo_actual AS "cicloActual",
             p.area_ha AS "areaHa", p.area_cuadras AS "areaCuadras",
             p.fecha_creacion AS "fechaCreacion", p.updated_at AS "updatedAt",
             p.created_by AS "createdBy", p.updated_by AS "updatedBy",
             ST_AsGeoJSON(p.geometria)::json AS geometria,
             u.nombres || ' ' || u.apellidos AS propietario_nombre,
             u.cedula AS propietario_cedula
      FROM parcelas p
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      ${where}
      ORDER BY p.updated_at DESC
    `, params);
  }

  private async queryZonas(ctx: AuthContext, since: Date | null) {
    const { where, params } = this.buildConditions(ctx, since, 'z', 'usuario_id');
    return AppDataSource.query(`
      SELECT z.id, z.usuario_id AS "usuarioId", z.nombre, z.descripcion,
             z.fecha_creacion AS "fechaCreacion", z.updated_at AS "updatedAt",
             ST_AsGeoJSON(z.geometria)::json AS geometria
      FROM zonas z
      ${where}
      ORDER BY z.nombre
    `, params);
  }

  private async queryCapas(ctx: AuthContext, since: Date | null) {
    const { where, params } = this.buildJoinConditions(ctx, since, 'cp');
    return AppDataSource.query(`
      SELECT cp.id, cp.parcela_id AS "parcelaId", cp.tipo,
             cp.ndvi_estimado AS "ndviEstimado",
             cp.fecha_actualizacion AS "fechaActualizacion",
             cp.updated_at AS "updatedAt",
             ST_AsGeoJSON(cp.geometria)::json AS geometria
      FROM capas_parcela cp
      INNER JOIN parcelas p ON p.id = cp.parcela_id
      ${where}
    `, params);
  }

  private async queryActividades(ctx: AuthContext, since: Date | null) {
    const { where, params } = this.buildJoinConditions(ctx, since, 'ap');
    return AppDataSource.query(`
      SELECT ap.*
      FROM actividades_parcela ap
      INNER JOIN parcelas p ON p.id = ap.parcela_id
      ${where}
      ORDER BY ap.fecha DESC
    `, params);
  }

  private async queryCiclos(ctx: AuthContext, since: Date | null) {
    const { where, params } = this.buildJoinConditions(ctx, since, 'ca');
    return AppDataSource.query(`
      SELECT ca.*
      FROM ciclos_actividad ca
      INNER JOIN parcelas p ON p.id = ca.parcela_id
      ${where}
      ORDER BY ca.fecha_inicio DESC
    `, params);
  }

  private async queryProductos(ctx: AuthContext, since: Date | null) {
    const conds: string[] = [];
    const params: any[]   = [];

    if (ctx.rol !== 'administrador') {
      params.push(ctx.usuarioId);
      conds.push(`p.usuario_id = $${params.length}`);
    }
    if (since) {
      params.push(since.toISOString());
      conds.push(`prod.updated_at > $${params.length}`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    return AppDataSource.query(`
      SELECT prod.*
      FROM productos_actividad prod
      INNER JOIN actividades_parcela ap ON ap.id = prod.actividad_id
      INNER JOIN parcelas p ON p.id = ap.parcela_id
      ${where}
    `, params);
  }
}
