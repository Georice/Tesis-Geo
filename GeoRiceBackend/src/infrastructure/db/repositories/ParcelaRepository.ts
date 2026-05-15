import { AppDataSource } from '../DataSource';
import { Parcela } from '../../../domain/entities/Parcela';
import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';

export class ParcelaRepository implements IParcelaRepository {
  private repo = AppDataSource.getRepository(Parcela);

  async findAll(): Promise<Parcela[]> {
    return this.repo
      .createQueryBuilder('p')
      .select([
        'p.id', 'p.nombre', 'p.propietario', 'p.cultivo', 'p.fechaCreacion',
        'ST_AsGeoJSON(p.geometria) AS p_geometria',
        'ST_Area(p.geometria::geography) / 10000 AS p_area_ha',
      ])
      .getRawMany();
  }

  async findById(id: number): Promise<Parcela | null> {
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<Parcela>): Promise<Parcela> {
    const parcela = this.repo.create(data);
    return this.repo.save(parcela);
  }

  async update(id: number, data: Partial<Parcela>): Promise<Parcela | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async updateGeometry(id: number, geometria: object): Promise<Parcela | null> {
    await AppDataSource.query(
      `UPDATE parcelas SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
      [JSON.stringify(geometria), id]
    );
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }


    // Calcula el área en hectáreas de una geometría GeoJSON antes de guardarla
  async calculateArea(geometria: object): Promise<number> {
    const result = await AppDataSource.query(
      `SELECT ST_Area(ST_GeomFromGeoJSON($1)::geography) / 10000 AS area_ha`,
      [JSON.stringify(geometria)]
    );
    return parseFloat(result[0].area_ha);
  }

  // Verifica si la geometría se superpone con alguna parcela existente (excluyendo la parcela con excludeId)
  async hasOverlap(geometria: object, excludeId?: number): Promise<boolean> {
    const query = excludeId
      ? `SELECT COUNT(*) FROM parcelas 
         WHERE id != $2 
         AND ST_Intersects(geometria, ST_GeomFromGeoJSON($1))
         AND NOT ST_Touches(geometria, ST_GeomFromGeoJSON($1))`
      : `SELECT COUNT(*) FROM parcelas 
         WHERE ST_Intersects(geometria, ST_GeomFromGeoJSON($1))
         AND NOT ST_Touches(geometria, ST_GeomFromGeoJSON($1))`;

    const params = excludeId
      ? [JSON.stringify(geometria), excludeId]
      : [JSON.stringify(geometria)];

    const result = await AppDataSource.query(query, params);
    return parseInt(result[0].count) > 0;
  }
}