import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export class DeactivateUsuario {
  constructor(private repo: IUserRepository) {}

  async execute(id: string, solicitanteId: string): Promise<void> {
    if (id === solicitanteId) throw new Error('No puedes desactivar tu propia cuenta');
    return this.repo.deactivate(id);
  }
}
