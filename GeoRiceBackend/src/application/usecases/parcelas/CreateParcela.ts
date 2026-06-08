import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { AuthContext }        from '../../../shared/types/AuthContext';

export class CreateParcela {
  constructor(private repo: IParcelaRepository) {}

  async execute(data: any, ctx: AuthContext): Promise<any> {
    if (!data.geometria) throw new Error('La geometría es obligatoria');
    return this.repo.create(data, ctx);
  }
}
