import { AppDataSource } from '../DataSource';
import { CapaParcela } from '../../../domain/entities/CapaParcela';
import { ICapaParcelaRepository } from '../../../domain/repositories/ICapaParcelaRepository';

export class CapaParcelaRepository implements ICapaParcelaRepository {
  private repo = AppDataSource.getRepository(CapaParcela);

  async findByParcela(parcelaId: number): Promise<CapaParcela[]> {
    return this.repo.find({ where: { parcelaId } });
  }

  async findById(id: number): Promise<CapaParcela | null> {
    return this.repo.findOneBy({ id });
  }

  // async create(data: Partial<CapaParcela>): Promise<CapaParcela> {
  //   const capa = this.repo.create(data);
  //   return this.repo.save(capa);
  // }

  async create(data: Partial<CapaParcela>): Promise<CapaParcela> {
  if (data.geometria && data.parcelaId) {
    const dentroParcela = await this.isInsideParcela(data.parcelaId, data.geometria);
    if (!dentroParcela) throw new Error('La capa debe estar dentro de los límites de la parcela');

    const result = await AppDataSource.query(
      `INSERT INTO capas_parcela (parcela_id, tipo, geometria)
       VALUES ($1, $2, ST_GeomFromGeoJSON($3))
       RETURNING id`,
      [data.parcelaId, data.tipo, JSON.stringify(data.geometria)]
    );
    const savedId = result[0].id;
    return this.findById(savedId) as Promise<CapaParcela>;
  }
  const capa = this.repo.create(data);
  return this.repo.save(capa);
}
  async update(id: number, data: Partial<CapaParcela>): Promise<CapaParcela | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async updateNdvi(id: number, ndviEstimado: number): Promise<CapaParcela | null> {
    await this.repo.update(id, { ndviEstimado });
    return this.findById(id);
  }

  // async updateGeometry(id: number, parcelaId: number, geometria: object): Promise<CapaParcela | null> {
  //   const dentro = await this.isInsideParcela(parcelaId, geometria);
  //   if (!dentro) throw new Error('La nueva geometría debe estar dentro de los límites de la parcela');
  //   await this.repo.query(
  //     `UPDATE capas_parcela SET geometria = ST_GeomFromGeoJSON($1) WHERE id = $2`,
  //     [JSON.stringify(geometria), id]
  //   );
  //   return this.findById(id);
  // }

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