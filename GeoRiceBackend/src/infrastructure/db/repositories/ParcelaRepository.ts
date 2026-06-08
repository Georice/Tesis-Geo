import { AppDataSource } from '../DataSource';
import { Parcela }             from '../../../domain/entities/Parcela';
import { IParcelaRepository }  from '../../../domain/repositories/IParcelaRepository';
import { AuthContext }         from '../../../shared/types/AuthContext';

export class ParcelaRepository implements IParcelaRepository {
  private repo = AppDataSource.getRepository(Parcela);

  async findAll(ctx: AuthContext): Promise<any[]> {
    const conds: string[] = [];
    const params: any[]   = [];

    if (ctx.rol !== 'administrador') {
      params.push(ctx.usuarioId);
      conds.push(`p.usuario_id = $${params.length}`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    return AppDataSource.query(`
      SELECT p.id, p.nombre, p.usuario_id AS "usuarioId",
             p.propietario, p.cultivo, p.estado,
             p.zona_id AS "zonaId", p.ciclo_actual AS "cicloActual",
             p.area_ha AS "areaHa", p.area_cuadras AS "areaCuadras",
             p.fecha_creacion AS "fechaCreacion", p.updated_at AS "updatedAt",
             ST_AsGeoJSON(p.geometria)::json AS geometria,
             u.nombres || ' ' || u.apellidos AS propietario_nombre,
             u.cedula AS propietario_cedula
      FROM parcelas p
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      ${where}
      ORDER BY p.fecha_creacion DESC
    `, params);
  }

  async findById(id: number, ctx: AuthContext): Promise<any | null> {
    const conds: string[] = ['p.id = $1'];
    const params: any[]   = [id];

    if (ctx.rol !== 'administrador') {
      params.push(ctx.usuarioId);
      conds.push(`p.usuario_id = $${params.length}`);
    }

    const result = await AppDataSource.query(`
      SELECT p.id, p.nombre, p.usuario_id AS "usuarioId",
             p.propietario, p.cultivo, p.estado,
             p.zona_id AS "zonaId", p.ciclo_actual AS "cicloActual",
             p.area_ha AS "areaHa", p.area_cuadras AS "areaCuadras",
             p.fecha_creacion AS "fechaCreacion", p.updated_at AS "updatedAt",
             ST_AsGeoJSON(p.geometria)::json AS geometria,
             u.nombres || ' ' || u.apellidos AS propietario_nombre
      FROM parcelas p
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      WHERE ${conds.join(' AND ')}
    `, params);

    return result[0] ?? null;
  }

  async findByZona(zonaId: number, ctx: AuthContext): Promise<any[]> {
    const conds: string[] = ['p.zona_id = $1'];
    const params: any[]   = [zonaId];

    if (ctx.rol !== 'administrador') {
      params.push(ctx.usuarioId);
      conds.push(`p.usuario_id = $${params.length}`);
    }

    return AppDataSource.query(`
      SELECT p.id, p.nombre, p.usuario_id AS "usuarioId", p.propietario,
             p.cultivo, p.estado, p.zona_id AS "zonaId"
      FROM parcelas p WHERE ${conds.join(' AND ')}
    `, params);
  }

  async create(data: any, ctx: AuthContext): Promise<any> {
    const propietarioId = ctx.rol === 'socio'
      ? ctx.usuarioId
      : (data.usuarioId ?? ctx.usuarioId);

    const [propietarioUser] = await AppDataSource.query(
      `SELECT nombres || ' ' || apellidos AS nombre FROM usuarios WHERE id = $1`,
      [propietarioId]
    );
    const propietarioNombre = propietarioUser?.nombre ?? ctx.nombreCompleto;

    if (!data.geometria) throw new Error('La geometría es obligatoria');

    const geom  = this.closeAndValidate(data.geometria);
    const area  = await this.calculateArea(geom);
    if (area <= 0) throw new Error('La geometría no tiene área válida');

    const overlap = await this.hasOverlap(geom);
    if (overlap) throw new Error('La parcela se superpone con una existente');

    const zonaId = await this.isInsideZona(geom);
    if (!zonaId) throw new Error('La parcela debe estar dentro de una zona registrada');

    const parcela = this.repo.create({
      usuarioId:   propietarioId,
      propietario: propietarioNombre,
      nombre:      data.nombre,
      cultivo:     data.cultivo ?? 'Arroz',
      estado:      data.estado  ?? 'activo',
      areaHa:      area,
      areaCuadras: area * 1.4222,
      zonaId,
      createdBy:   ctx.usuarioId,
      updatedBy:   ctx.usuarioId,
    });

    const saved = await this.repo.save(parcela);

    await AppDataSource.query(
      `UPDATE parcelas SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
      [JSON.stringify(geom), saved.id]
    );

    return this.findById(saved.id, ctx);
  }

  async update(id: number, data: any, ctx: AuthContext): Promise<any | null> {
    await this.verifyOwnership(id, ctx);

    const sets: string[] = ['updated_by = $1', 'updated_at = NOW()'];
    const params: any[]  = [ctx.usuarioId];

    if (data.nombre      != null) { params.push(data.nombre);      sets.push(`nombre = $${params.length}`); }
    if (data.cultivo     != null) { params.push(data.cultivo);     sets.push(`cultivo = $${params.length}`); }
    if (data.estado      != null) { params.push(data.estado);      sets.push(`estado = $${params.length}`); }
    if (data.cicloActual != null) { params.push(data.cicloActual); sets.push(`ciclo_actual = $${params.length}`); }

    // Solo admin puede reasignar propietario
    if (ctx.rol === 'administrador' && data.usuarioId != null) {
      const [newOwner] = await AppDataSource.query(
        `SELECT nombres || ' ' || apellidos AS nombre FROM usuarios WHERE id = $${params.length + 1}`,
        [...params, data.usuarioId]
      );
      params.push(data.usuarioId);
      sets.push(`usuario_id = $${params.length}`);
      if (newOwner) {
        params.push(newOwner.nombre);
        sets.push(`propietario = $${params.length}`);
      }
    }

    params.push(id);
    await AppDataSource.query(
      `UPDATE parcelas SET ${sets.join(', ')} WHERE id = $${params.length}`,
      params
    );

    return this.findById(id, ctx);
  }

  async updateGeometry(id: number, geometria: object, ctx: AuthContext): Promise<any | null> {
    await this.verifyOwnership(id, ctx);

    const geom  = this.closeAndValidate(geometria);
    const area  = await this.calculateArea(geom);
    if (area <= 0) throw new Error('La geometría no tiene área válida');

    const overlap = await this.hasOverlap(geom, id);
    if (overlap) throw new Error('La nueva geometría se superpone con una existente');

    const zonaId = await this.isInsideZona(geom);
    if (!zonaId) throw new Error('La parcela debe estar dentro de una zona registrada');

    await AppDataSource.query(`
      UPDATE parcelas SET
        geometria    = ST_GeomFromGeoJSON($1),
        area_ha      = $2,
        area_cuadras = $3,
        zona_id      = $4,
        updated_by   = $5,
        updated_at   = NOW()
      WHERE id = $6
    `, [JSON.stringify(geom), area, area * 1.4222, zonaId, ctx.usuarioId, id]);

    return this.findById(id, ctx);
  }

  async updateEstado(id: number, estado: string, ctx: AuthContext): Promise<any | null> {
    await this.verifyOwnership(id, ctx);
    await AppDataSource.query(
      `UPDATE parcelas SET estado = $1, updated_by = $2, updated_at = NOW() WHERE id = $3`,
      [estado, ctx.usuarioId, id]
    );
    return this.findById(id, ctx);
  }

  async delete(id: number, ctx: AuthContext): Promise<boolean> {
    await this.verifyOwnership(id, ctx);
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async calculateArea(geometria: object): Promise<number> {
    const result = await AppDataSource.query(
      `SELECT ST_Area(ST_GeomFromGeoJSON($1)::geography) / 10000 AS area_ha`,
      [JSON.stringify(geometria)]
    );
    return parseFloat(result[0]?.area_ha ?? '0');
  }

  async hasOverlap(geometria: object, excludeId?: number): Promise<boolean> {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('ST_Intersects(p.geometria, ST_GeomFromGeoJSON(:geom))', { geom: JSON.stringify(geometria) })
      .andWhere('NOT ST_Touches(p.geometria, ST_GeomFromGeoJSON(:geom))', { geom: JSON.stringify(geometria) });

    if (excludeId) qb.andWhere('p.id != :excludeId', { excludeId });

    return (await qb.getCount()) > 0;
  }

  async isInsideZona(geometria: object): Promise<number | null> {
    const result = await AppDataSource.query(
      `SELECT id FROM zonas WHERE ST_Within(ST_GeomFromGeoJSON($1), geometria) LIMIT 1`,
      [JSON.stringify(geometria)]
    );
    return result.length > 0 ? result[0].id : null;
  }

  private async verifyOwnership(id: number, ctx: AuthContext): Promise<void> {
    if (ctx.rol === 'administrador') return;
    const result = await AppDataSource.query(
      `SELECT usuario_id FROM parcelas WHERE id = $1`, [id]
    );
    if (!result[0]) throw new Error('Parcela no encontrada');
    if (result[0].usuario_id !== ctx.usuarioId) {
      throw new Error('No autorizado para modificar esta parcela');
    }
  }

  private closeAndValidate(geometria: object): object {
    const geom   = JSON.parse(JSON.stringify(geometria));
    const coords = geom?.coordinates?.[0] ?? [];
    const first  = coords[0];
    const last   = coords[coords.length - 1];
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
      geom.coordinates[0] = [...coords, first];
    }
    return geom;
  }
}
