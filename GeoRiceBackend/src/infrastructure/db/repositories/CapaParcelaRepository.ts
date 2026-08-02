import { AppDataSource } from '../DataSource';
import { CapaParcelaModel } from '../models/CapaParcelaModel';
import { CapaParcela } from '../../../domain/entities/CapaParcela';
import {
  ICapaParcelaRepository,
  CrearCapaComando,
  ActualizarCapaComando,
} from '../../../domain/repositories/ICapaParcelaRepository';
import { CapaParcelaMapper } from '../mappers/CapaParcelaMapper';

export class CapaParcelaRepository implements ICapaParcelaRepository {
  private repo = AppDataSource.getRepository(CapaParcelaModel);

  async findByParcela(parcelaId: number): Promise<CapaParcela[]> {
    const rows = await this.repo.find({ where: { parcelaId } });
    return rows.map(CapaParcelaMapper.toDomain);
  }

  async findById(id: number): Promise<CapaParcela | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? CapaParcelaMapper.toDomain(row) : null;
  }

  async create(data: CrearCapaComando): Promise<CapaParcela> {
    const dentroParcela = await this.isInsideParcela(data.parcelaId, data.geometria);
    if (!dentroParcela) throw new Error('La capa debe estar dentro de los límites de la parcela');

    const result = await AppDataSource.query(
      `INSERT INTO capas_parcela (parcela_id, tipo, geometria, ndvi_estimado, created_by, updated_by)
       VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4, $5, $6)
       RETURNING id`,
      [
        data.parcelaId, data.tipo, JSON.stringify(data.geometria),
        data.ndviEstimado ?? null, data.createdBy ?? null, data.updatedBy ?? null,
      ]
    );
    return (await this.findById(result[0].id))!;
  }

  async update(id: number, data: ActualizarCapaComando): Promise<CapaParcela | null> {
    const { geometria, ...rest } = data;
    if (Object.keys(rest).length > 0) {
      await this.repo.update(id, rest);
    }
    if (geometria) {
      await AppDataSource.query(
        `UPDATE capas_parcela SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
        [JSON.stringify(geometria), id]
      );
    }
    return this.findById(id);
  }

  async updateNdvi(id: number, ndviEstimado: number): Promise<CapaParcela | null> {
    await this.repo.update(id, { ndviEstimado });
    return this.findById(id);
  }

  async updateGeometry(id: number, parcelaId: number, geometria: object): Promise<CapaParcela | null> {
    const dentro = await this.isInsideParcela(parcelaId, geometria);
    if (!dentro) throw new Error('La nueva geometría debe estar dentro de los límites de la parcela');
    await AppDataSource.query(
      `UPDATE capas_parcela SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
      [JSON.stringify(geometria), id]
    );
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async isInsideParcela(parcelaId: number, geometria: object): Promise<boolean> {
    const result = await AppDataSource.query(
      `SELECT ST_Contains(
        (SELECT geometria FROM parcelas WHERE id = $1),
        ST_GeomFromGeoJSON($2)
      ) AS dentro`,
      [parcelaId, JSON.stringify(geometria)]
    );
    return result[0].dentro;
  }
}
