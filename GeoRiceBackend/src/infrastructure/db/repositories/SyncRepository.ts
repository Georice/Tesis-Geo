import { AppDataSource } from '../DataSource';
import { AuthContext } from '../../../shared/types/AuthContext';
import { ISyncRepository, SyncDataResult } from '../../../domain/repositories/ISyncRepository';

export class SyncRepository implements ISyncRepository {
  async getSyncData(ctx: AuthContext, since: Date | null): Promise<SyncDataResult> {
    const [parcelas, zonas, capas, actividades, ciclos, productos] = await Promise.all([
      this.queryParcelas(ctx, since),
      this.queryZonas(ctx, since),
      this.queryCapas(ctx, since),
      this.queryActividades(ctx, since),
      this.queryCiclos(ctx, since),
      this.queryProductos(ctx, since),
    ]);
    return { parcelas, zonas, capas, actividades, ciclos, productos };
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
             u.nombres || ' ' || u.apellidos AS propietario_nombre
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
    // ap.* no trae la fase (solo fase_id) — se arma aparte con LEFT JOIN
    // para que la caché offline pueda mostrar lo mismo que el endpoint en
    // vivo (que sí la trae vía la relación de TypeORM).
    return AppDataSource.query(`
      SELECT ap.*,
        CASE WHEN f.id IS NOT NULL THEN json_build_object(
          'id',             f.id,
          'codigo',         f.codigo,
          'nombre',         f.nombre,
          'tipoCiclo',      f.tipo_ciclo,
          'ordenFase',      f.orden_fase,
          'ordenMin',       f.orden_min,
          'ordenMax',       f.orden_max,
          'tiposActividad', f.tipos_actividad,
          'descripcion',    f.descripcion
        ) ELSE NULL END AS fase
      FROM actividades_parcela ap
      INNER JOIN parcelas p ON p.id = ap.parcela_id
      LEFT JOIN fases_ciclo f ON f.id = ap.fase_id
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
