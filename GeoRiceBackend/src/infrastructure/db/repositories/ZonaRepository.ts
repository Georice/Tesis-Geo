import { AppDataSource } from '../DataSource';
import { Zona } from '../../../domain/entities/Zona';
import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';

export class ZonaRepository implements IZonaRepository {
  delete(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  private repo = AppDataSource.getRepository(Zona);

  async findAll(): Promise<Zona[]> {
    return this.repo.createQueryBuilder('z')
      .select([
        'z.id', 'z.nombre', 'z.descripcion', 'z.fechaCreacion',
        'ST_AsGeoJSON(z.geometria) AS z_geometria',
      ])
      .getRawMany();
  }

  async findById(id: number): Promise<Zona | null> {
    return this.repo.findOneBy({ id });
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

  // async create(data: Partial<Zona>): Promise<Zona> {
  //   if (data.geometria) {
  //     const geom   = this.closeRing(data.geometria);
  //     const geoStr = JSON.stringify(geom);
  //     const { geometria, ...rest } = data;
  //     const zona   = this.repo.create(rest);
  //     const saved  = await this.repo.save(zona);
  //     await AppDataSource.query(
  //       `UPDATE zonas SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
  //       [geoStr, saved.id]
  //     );
  //     return this.findById(saved.id) as Promise<Zona>;
  //   }
  //   const zona = this.repo.create(data);
  //   return this.repo.save(zona);
  // }


  async create(data: Partial<Zona>): Promise<Zona> {
  if (data.geometria) {
    const geom   = this.closeRing(data.geometria);
    const geoStr = JSON.stringify(geom);
    const { geometria, ...rest } = data;
    const zona   = this.repo.create(rest);
    const saved  = await this.repo.save(zona);
    console.log('ID GUARDADO:', saved.id);
    console.log('GEOSTR:', geoStr);
    try {
      await AppDataSource.query(
        `UPDATE zonas SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
        [geoStr, saved.id]
      );
      console.log('UPDATE EXITOSO');
    } catch (err) {
      console.log('ERROR EN UPDATE:', err);
      throw err;
    }
    return this.findById(saved.id) as Promise<Zona>;
  }
  const zona = this.repo.create(data);
  return this.repo.save(zona);
}

  // async update(id: number, data: Partial<Zona>): Promise<Zona | null> {
  //   if (data.geometria) {
  //     const geom           = this.closeRing(data.geometria);
  //     const { geometria, ...rest } = data;
  //     if (Object.keys(rest).length > 0) await this.repo.update(id, rest);
  //     await AppDataSource.query(
  //       `UPDATE zonas SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
  //       [JSON.stringify(geom), id]
  //     );
  //     return this.findById(id);
  //   }
  //   await this.repo.update(id, data);
  //   return this.findById(id);
  // }

  // async delete(id: number): Promise<boolean> {
  //   const result = await this.repo.delete(id);
  //   return (result.affected ?? 0) > 0;
  // }

  async update(id: number, data: Partial<Zona>): Promise<Zona | null> {
  if (data.geometria) {
    const geom = this.closeRing(data.geometria);
    const { geometria, ...rest } = data;
    if (Object.keys(rest).length > 0) await this.repo.update(id, rest);
    await AppDataSource.query(
      `UPDATE zonas SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
      [JSON.stringify(geom), id]
    );
    // ← reasignar parcelas que ahora quedan dentro
    await AppDataSource.query(
      `UPDATE parcelas SET zona_id = NULL WHERE zona_id = $1`, [id]
    );
    await this.assignParcelasInsideZona(id);
    return this.findById(id);
  }
  await this.repo.update(id, data);
  return this.findById(id);
}

  // async assignParcelasInsideZona(zonaId: number): Promise<number> {
  //   const result = await AppDataSource.query(
  //     `UPDATE parcelas
  //      SET zona_id = $1
  //      WHERE ST_Contains(
  //        (SELECT geometria FROM zonas WHERE id = $1),
  //        geometria
  //      )
  //      AND (zona_id IS NULL OR zona_id != $1)`,
  //     [zonaId]
  //   );
  //   return result[1] ?? 0;
  // }

 async assignParcelasInsideZona(zonaId: number): Promise<number> {
  const result = await AppDataSource.query(
    `UPDATE parcelas
     SET zona_id = $1
     WHERE ST_Within(
       geometria,
       (SELECT geometria FROM zonas WHERE id = $1)
     )
     AND (zona_id IS NULL OR zona_id != $1)`,
    [zonaId]
  );
  return result[1] ?? 0;
}
}