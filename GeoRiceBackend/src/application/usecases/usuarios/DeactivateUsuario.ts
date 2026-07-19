import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export class DeactivateUsuario {
  constructor(private repo: IUserRepository) {}

  async execute(id: string, updatedBy: string): Promise<void> {
    if (id === updatedBy) throw new Error('No puedes desactivar tu propia cuenta');
    return this.repo.deactivate(id, updatedBy);
  }
}
