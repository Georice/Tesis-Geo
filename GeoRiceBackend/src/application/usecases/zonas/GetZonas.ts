import { IZonaRepository } from '../../../domain/repositories/IZonaRepository';
import { AuthContext }     from '../../../shared/types/AuthContext';

export class GetZonas {
  constructor(private repo: IZonaRepository) {}

  async execute(ctx: AuthContext): Promise<any[]> {
    return this.repo.findAll(ctx);
  }
}
