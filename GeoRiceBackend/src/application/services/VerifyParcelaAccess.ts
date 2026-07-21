import { IParcelaRepository } from '../../domain/repositories/IParcelaRepository';
import { AuthContext } from '../../shared/types/AuthContext';

// Servicio de aplicación reutilizado por los controllers de capas, actividades
// y ciclos para verificar que una parcela existe y pertenece al usuario
// autenticado, sin que cada controller repita SQL crudo contra AppDataSource.
export class VerifyParcelaAccess {
  constructor(private parcelaRepo: IParcelaRepository) {}

  async execute(parcelaId: number, ctx: AuthContext): Promise<void> {
    const parcela = await this.parcelaRepo.findById(parcelaId, ctx);
    if (!parcela) throw new Error('Parcela no encontrada o no autorizado');
  }
}
