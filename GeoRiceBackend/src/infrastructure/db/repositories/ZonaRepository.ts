import { AppDataSource }       from '../DataSource';
import { Zona }                from '../../../domain/entities/Zona';
import { IZonaRepository }     from '../../../domain/repositories/IZonaRepository';
import { AuthContext }         from '../../../shared/types/AuthContext';

export class ZonaRepository implements IZonaRepository {
  private repo = AppDataSource.getRepository(Zona);

  async findAll(ctx: AuthContext): Promise<any[]> {
    const conds: string[] = [];
    const params: any[]   = [];

    if (ctx.rol !== 'administrador') {
      params.push(ctx.usuarioId);
      conds.push(`z.usuario_id = $${params.length}`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    return AppDataSource.query(`
      SELECT z.id, z.usuario_id AS "usuarioId", z.nombre, z.descripcion,
             z.fecha_creacion AS "fechaCreacion", z.updated_at AS "updatedAt",
             ST_AsGeoJSON(z.geometria)::json AS geometria
      FROM zonas z ${where}
      ORDER BY z.nombre
    `, params);
  }

  async findById(id: number): Promise<any | null> {
    const result = await AppDataSource.query(`
      SELECT z.id, z.usuario_id AS "usuarioId", z.nombre, z.descripcion,
             z.fecha_creacion AS "fechaCreacion", z.updated_at AS "updatedAt",
             ST_AsGeoJSON(z.geometria)::json AS geometria
      FROM zonas z WHERE z.id = $1
    `, [id]);
    return result[0] ?? null;
  }

  async create(data: any, ctx: AuthContext): Promise<any> {
    const zona = this.repo.create({
      usuarioId:  ctx.usuarioId,
      nombre:     data.nombre,
      descripcion: data.descripcion ?? null,
      createdBy:  ctx.usuarioId,
      updatedBy:  ctx.usuarioId,
    });
    const saved = await this.repo.save(zona);

    if (data.geometria) {
      const geom = this.closeRing(data.geometria);
      await AppDataSource.query(
        `UPDATE zonas SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
        [JSON.stringify(geom), saved.id]
      );
    }

    return this.findById(saved.id);
  }

  async update(id: number, data: any, ctx: AuthContext): Promise<any | null> {
    await this.verifyOwnership(id, ctx);

    const sets: string[] = ['updated_by = $1', 'updated_at = NOW()'];
    const params: any[]  = [ctx.usuarioId];

    if (data.nombre      != null) { params.push(data.nombre);      sets.push(`nombre = $${params.length}`); }
    if (data.descripcion != null) { params.push(data.descripcion); sets.push(`descripcion = $${params.length}`); }

    params.push(id);
    await AppDataSource.query(
      `UPDATE zonas SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params
    );

    if (data.geometria) {
      const geom = this.closeRing(data.geometria);
      await AppDataSource.query(
        `UPDATE zonas SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
        [JSON.stringify(geom), id]
      );
      await AppDataSource.query(`UPDATE parcelas SET zona_id = NULL WHERE zona_id = $1`, [id]);
      await this.assignParcelasInsideZona(id);
    }

    return this.findById(id);
  }

  async delete(id: number, ctx: AuthContext): Promise<boolean> {
    await this.verifyOwnership(id, ctx);
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async assignParcelasInsideZona(zonaId: number): Promise<number> {
    const result = await AppDataSource.query(`
      UPDATE parcelas SET zona_id = $1
      WHERE ST_Within(geometria, (SELECT geometria FROM zonas WHERE id = $1))
        AND (zona_id IS NULL OR zona_id != $1)
    `, [zonaId]);
    return result[1] ?? 0;
  }

  private async verifyOwnership(id: number, ctx: AuthContext): Promise<void> {
    if (ctx.rol === 'administrador') return;
    const result = await AppDataSource.query(
      `SELECT usuario_id FROM zonas WHERE id = $1`, [id]
    );
    if (!result[0]) throw new Error('Zona no encontrada');
    if (result[0].usuario_id !== ctx.usuarioId) {
      throw new Error('No autorizado para modificar esta zona');
    }
  }

  private closeRing(geometria: any): any {
    const coords = geometria?.coordinates?.[0] ?? [];
    const first  = coords[0];
    const last   = coords[coords.length - 1];
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
      return { ...geometria, coordinates: [[...coords, first]] };
    }
    return geometria;
  }
}
