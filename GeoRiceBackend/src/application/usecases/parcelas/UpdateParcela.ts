import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { AuthContext }        from '../../../shared/types/AuthContext';

export class UpdateParcela {
  constructor(private repo: IParcelaRepository) {}

  async execute(id: number, data: any, ctx: AuthContext): Promise<any | null> {
    return this.repo.update(id, data, ctx);
  }
}
