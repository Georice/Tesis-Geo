import { AppDataSource } from '../DataSource';
import {
  IReporteRepository,
  ReporteFiltros,
  ReporteResumen,
} from '../../../domain/repositories/IReporteRepository';

export class ReporteRepository implements IReporteRepository {

  async getResumen(filtros: ReporteFiltros): Promise<ReporteResumen> {
    const { fechaInicio, fechaFin, usuarioId } = filtros;

    // WHERE compartido por las queries que parten de actividades_parcela
    const condsAct: string[] = ['a.fecha::date BETWEEN $1 AND $2'];
    const paramsAct: any[]   = [fechaInicio, fechaFin];
    if (usuarioId) {
      paramsAct.push(usuarioId);
      condsAct.push(`p.usuario_id = $${paramsAct.length}`);
    }
    const whereAct = condsAct.join(' AND ');

    const [resumenRows, estadoRows, tipoRows, ciclos, actividades, socio] = await Promise.all([
      AppDataSource.query(`
        SELECT
          COUNT(a.id)::int                              AS total_actividades,
          COUNT(DISTINCT a.ciclo_id)::int                AS total_ciclos,
          COALESCE(SUM(a.costo_total_actividad), 0)::numeric AS costo_total
        FROM public.actividades_parcela a
        JOIN public.parcelas p ON p.id = a.parcela_id
        WHERE ${whereAct}
      `, paramsAct),

      AppDataSource.query(`
        SELECT a.estado, COUNT(*)::int AS cantidad
        FROM public.actividades_parcela a
        JOIN public.parcelas p ON p.id = a.parcela_id
        WHERE ${whereAct}
        GROUP BY a.estado
        ORDER BY a.estado
      `, paramsAct),

      AppDataSource.query(`
        SELECT a.tipo,
               COUNT(*)::int                                  AS cantidad,
               COALESCE(SUM(a.costo_total_actividad), 0)::numeric AS costo_total
        FROM public.actividades_parcela a
        JOIN public.parcelas p ON p.id = a.parcela_id
        WHERE ${whereAct}
        GROUP BY a.tipo
        ORDER BY costo_total DESC
      `, paramsAct),

      this.getCiclos(fechaInicio, fechaFin, usuarioId),
      this.getActividades(fechaInicio, fechaFin, usuarioId),
      usuarioId ? this.getSocioNombre(usuarioId) : Promise.resolve(null),
    ]);

    const areaTrabajada = ciclos.reduce(
      (acc: number, c: any) => acc + (Number(c.areaSembrada) || 0), 0,
    );

    return {
      filtros: { fechaInicio, fechaFin, usuarioId, socioNombre: socio },
      resumen: {
        totalActividades: resumenRows[0]?.total_actividades ?? 0,
        totalCiclos:       resumenRows[0]?.total_ciclos ?? 0,
        costoTotal:        Number(resumenRows[0]?.costo_total ?? 0),
        areaTrabajada,
      },
      actividadesPorEstado: estadoRows.map((r: any) => ({
        estado: r.estado, cantidad: r.cantidad,
      })),
      costoPorTipo: tipoRows.map((r: any) => ({
        tipo: r.tipo, cantidad: r.cantidad, costoTotal: Number(r.costo_total),
      })),
      ciclos,
      actividades,
    };
  }

  private async getCiclos(fechaInicio: string, fechaFin: string, usuarioId: string | null) {
    const conds: string[] = [
      'c.fecha_inicio::date <= $2',
      '(c.fecha_fin IS NULL OR c.fecha_fin::date >= $1)',
    ];
    const params: any[] = [fechaInicio, fechaFin];
    if (usuarioId) {
      params.push(usuarioId);
      conds.push(`p.usuario_id = $${params.length}`);
    }

    const rows = await AppDataSource.query(`
      SELECT
        c.id, c.tipo, c.estado,
        c.fecha_inicio                                   AS "fechaInicio",
        c.fecha_fin                                       AS "fechaFin",
        c.area_sembrada                                    AS "areaSembrada",
        p.nombre                                            AS "parcelaNombre",
        COALESCE((
          SELECT SUM(a2.costo_total_actividad)
          FROM public.actividades_parcela a2
          WHERE a2.ciclo_id = c.id
        ), 0)::numeric AS "costoTotal"
      FROM public.ciclos_actividad c
      JOIN public.parcelas p ON p.id = c.parcela_id
      WHERE ${conds.join(' AND ')}
      ORDER BY c.fecha_inicio DESC
    `, params);

    return rows.map((r: any) => ({ ...r, costoTotal: Number(r.costoTotal) }));
  }

  private async getActividades(fechaInicio: string, fechaFin: string, usuarioId: string | null) {
    const conds: string[] = ['a.fecha::date BETWEEN $1 AND $2'];
    const params: any[]   = [fechaInicio, fechaFin];
    if (usuarioId) {
      params.push(usuarioId);
      conds.push(`p.usuario_id = $${params.length}`);
    }

    const rows = await AppDataSource.query(`
      SELECT
        a.id, a.fecha, a.tipo, a.estado,
        p.nombre                                          AS "parcelaNombre",
        c.tipo                                             AS "cicloTipo",
        (u.nombres || ' ' || u.apellidos)                  AS "socioNombre",
        COALESCE(a.costo_insumos, 0)::numeric              AS "costoInsumos",
        COALESCE(a.costo_total_actividad, 0)::numeric      AS "costoTotal"
      FROM public.actividades_parcela a
      JOIN public.parcelas p ON p.id = a.parcela_id
      JOIN public.usuarios u ON u.id = p.usuario_id
      LEFT JOIN public.ciclos_actividad c ON c.id = a.ciclo_id
      WHERE ${conds.join(' AND ')}
      ORDER BY a.fecha DESC
    `, params);

    return rows.map((r: any) => ({
      ...r,
      costoInsumos: Number(r.costoInsumos),
      costoTotal:   Number(r.costoTotal),
    }));
  }

  private async getSocioNombre(usuarioId: string): Promise<string | null> {
    const rows = await AppDataSource.query(
      `SELECT (nombres || ' ' || apellidos) AS nombre FROM public.usuarios WHERE id = $1`,
      [usuarioId],
    );
    return rows[0]?.nombre ?? null;
  }
}
