import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { AuthContext }        from '../../../shared/types/AuthContext';

export class GetParcelas {
  constructor(private repo: IParcelaRepository) {}

  async execute(ctx: AuthContext): Promise<any[]> {
    return this.repo.findAll(ctx);
  }
}
