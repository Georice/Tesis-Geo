import { IParcelaRepository } from '../../../domain/repositories/IParcelaRepository';
import { AuthContext }        from '../../../shared/types/AuthContext';

export class DeleteParcela {
  constructor(private repo: IParcelaRepository) {}

  async execute(id: number, ctx: AuthContext): Promise<boolean> {
    return this.repo.delete(id, ctx);
  }
}
