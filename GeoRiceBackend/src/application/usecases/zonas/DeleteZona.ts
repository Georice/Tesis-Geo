import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { AppDataSource }   from '../../../infrastructure/db/DataSource';
import { AuthContext }     from '../../../shared/types/AuthContext';

export class DeleteZona {
  constructor(private repo: IZonaRepository) {}

  async execute(id: number, ctx: AuthContext): Promise<boolean> {
    const result = await AppDataSource.query(
      `SELECT COUNT(*) as total FROM parcelas WHERE zona_id = $1`, [id]
    );
    const total = Number(result[0]?.total ?? 0);
    if (total > 0) {
      throw new Error(`No se puede eliminar la zona porque tiene ${total} parcela(s) asignada(s)`);
    }
    return this.repo.delete(id, ctx);
  }
}
