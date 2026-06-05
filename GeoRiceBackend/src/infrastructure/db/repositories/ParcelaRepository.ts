import { AppDataSource } from '../DataSource';
import { Parcela } from '../../../domain/entities/Parcela';
import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';

export class ParcelaRepository implements IParcelaRepository {
  private repo = AppDataSource.getRepository(Parcela);

  async findAll(): Promise<any[]> {
    return this.repo
      .createQueryBuilder('p')
      .select([
        'p.id', 'p.nombre', 'p.propietario', 'p.cultivo',
        'p.estado', 'p.zonaId', 'p.cicloActual', 'p.areaHa', 'p.fechaCreacion',
        'ST_AsGeoJSON(p.geometria) AS p_geometria',
        'ST_Area(p.geometria::geography) / 10000 AS p_area_ha',
      ])
      .getRawMany();
  }

  async findById(id: number): Promise<Parcela | null> {
    return this.repo.findOneBy({ id });
  }

  async findByZona(zonaId: number): Promise<Parcela[]> {
    return this.repo.find({ where: { zonaId } });
  }

async create(data: Partial<Parcela>): Promise<Parcela> {
  if (data.geometria) {
    const geom    = this.closeAndValidate(data.geometria);
    const area    = await this.calculateArea(geom);
    if (area <= 0) throw new Error('La geometría no tiene área válida');
    const overlap = await this.hasOverlap(geom);
    if (overlap)  throw new Error('La parcela se superpone con una existente');

    const zonaId = await this.isInsideZona(geom);
    if (!zonaId) throw new Error('La parcela debe estar dentro de una zona registrada');

    const { geometria, ...rest } = data as any;
    const parcela = this.repo.create({ ...rest, areaHa: area, zonaId });
    const saved   = await this.repo.save(parcela);
    const savedId = (saved as any).id;

    await AppDataSource.query(
      `UPDATE parcelas SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
      [JSON.stringify(geom), savedId]
    );

    const result = await AppDataSource.query(
      `SELECT id, nombre, propietario, cultivo, estado, zona_id as "zonaId",
              area_ha as "areaHa", fecha_creacion as "fechaCreacion",
              ST_AsGeoJSON(geometria) AS p_geometria,
              ST_Area(geometria::geography) / 10000 AS p_area_ha
       FROM parcelas WHERE id = $1`,
      [savedId]
    );

    return result[0];
  }
  const parcela = this.repo.create(data);
  return this.repo.save(parcela);
}
async isInsideZona(geometria: object): Promise<number | null> {
  const result = await AppDataSource.query(
    `SELECT id FROM zonas 
     WHERE ST_Intersects(
       ST_GeomFromGeoJSON($1),
       geometria
     )
     LIMIT 1`,
    [JSON.stringify(geometria)]
  );
  return result.length > 0 ? result[0].id : null;
}
  // async create(data: Partial<Parcela>): Promise<Parcela> {
  //   if (data.geometria) {
  //     const geom    = this.closeAndValidate(data.geometria);
  //     const area    = await this.calculateArea(geom);
  //     if (area <= 0) throw new Error('La geometría no tiene área válida');
  //     const overlap = await this.hasOverlap(geom);
  //     if (overlap)  throw new Error('La parcela se superpone con una existente');

  //     const { geometria, ...rest } = data as any;
  //     const parcela = this.repo.create({ ...rest, areaHa: area });
  //     const saved   = await this.repo.save(parcela);

  //     await this.repo.createQueryBuilder()
  //       .update(Parcela)
  //       .set({ geometria: () => `ST_GeomFromGeoJSON('${JSON.stringify(geom)}')` } as any)
  //       .where('id = :id', { id: saved.id })
  //       .execute();

  //     return this.findById(saved.id) as Promise<Parcela>;
  //   }
  //   const parcela = this.repo.create(data);
  //   return this.repo.save(parcela);
  // }

  async update(id: number, data: Partial<Parcela>): Promise<Parcela | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  // async updateGeometry(id: number, geometria: object): Promise<Parcela | null> {
  //   const geom    = this.closeAndValidate(geometria);
  //   const area    = await this.calculateArea(geom);
  //   if (area <= 0) throw new Error('La geometría no tiene área válida');
  //   const overlap = await this.hasOverlap(geom, id);
  //   if (overlap)  throw new Error('La nueva geometría se superpone con una existente');

  //   await this.repo.createQueryBuilder()
  //     .update(Parcela)
  //     .set({
  //       geometria: () => `ST_GeomFromGeoJSON('${JSON.stringify(geom)}')`,
  //       areaHa:    area as any,
  //     } as any)
  //     .where('id = :id', { id })
  //     .execute();

  //   return this.findById(id);
  // }

  
  // async updateGeometry(id: number, geometria: object): Promise<Parcela | null> {
  //   const geom    = this.closeAndValidate(geometria);
  //   const area    = await this.calculateArea(geom);
  //   if (area <= 0) throw new Error('La geometría no tiene área válida');
  //   const overlap = await this.hasOverlap(geom, id);
  //   if (overlap)  throw new Error('La nueva geometría se superpone con una existente');

  //   await this.repo.createQueryBuilder()
  //     .update(Parcela)
  //     .set({
  //       geometria: () => `ST_GeomFromGeoJSON('${JSON.stringify(geom)}')`,
  //       areaHa:    area as any,
  //     } as any)
  //     .where('id = :id', { id })
  //     .execute();

  //   return this.findById(id);
  // }


  async updateGeometry(id: number, geometria: object): Promise<Parcela | null> {
  const geom    = this.closeAndValidate(geometria);
  const area    = await this.calculateArea(geom);
  if (area <= 0) throw new Error('La geometría no tiene área válida');
  const overlap = await this.hasOverlap(geom, id);
  if (overlap)  throw new Error('La nueva geometría se superpone con una existente');

  const zonaId = await this.isInsideZona(geom);
  if (!zonaId) throw new Error('La parcela debe estar dentro de una zona registrada');

  await this.repo.createQueryBuilder()
    .update(Parcela)
    .set({
      geometria: () => `ST_GeomFromGeoJSON('${JSON.stringify(geom)}')`,
      areaHa:    area as any,
      zonaId:    zonaId as any,
    } as any)
    .where('id = :id', { id })
    .execute();

  return this.findById(id);
}

  async updateEstado(id: number, estado: string): Promise<Parcela | null> {
    await this.repo.update(id, { estado: estado as any });
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // async calculateArea(geometria: object): Promise<number> {
  //   const result = await this.repo
  //     .createQueryBuilder()
  //     .select(`ST_Area(ST_GeomFromGeoJSON(:geom)::geography) / 10000`, 'area_ha')
  //     .setParameter('geom', JSON.stringify(geometria))
  //     .getRawOne();
  //   return parseFloat(result.area_ha);
  // }

  //   async calculateArea(geometria: object): Promise<number> {
  //   const result = await this.repo
  //     .createQueryBuilder()
  //     .select(`ST_Area(ST_GeomFromGeoJSON(:geom)::geography) / 10000`, 'area_ha')
  //     .setParameter('geom', JSON.stringify(geometria))
  //     .getRawOne();
  //   return parseFloat(result.area_ha);
  // }

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
      .where(`ST_Intersects(p.geometria, ST_GeomFromGeoJSON(:geom))`, { geom: JSON.stringify(geometria) })
      .andWhere(`NOT ST_Touches(p.geometria, ST_GeomFromGeoJSON(:geom))`, { geom: JSON.stringify(geometria) });

    if (excludeId) qb.andWhere('p.id != :excludeId', { excludeId });

    const count = await qb.getCount();
    return count > 0;
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