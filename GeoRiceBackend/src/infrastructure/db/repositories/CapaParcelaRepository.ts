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

  async create(data: Partial<CapaParcela>): Promise<CapaParcela> {
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