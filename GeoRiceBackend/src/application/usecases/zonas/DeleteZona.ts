import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { AuthContext }     from '../../../shared/types/AuthContext';

export class DeleteZona {
  constructor(private repo: IZonaRepository) {}

  async execute(id: number, ctx: AuthContext): Promise<boolean> {
    const total = await this.repo.countParcelasAsignadas(id);
    if (total > 0) {
      throw new Error(`No se puede eliminar la zona porque tiene ${total} parcela(s) asignada(s)`);
    }
    return this.repo.delete(id, ctx);
  }
}
