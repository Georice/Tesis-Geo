import { IUserRepository } from '../../../domain/repositories/IUserRepository';

export class ActivateUsuario {
  constructor(private repo: IUserRepository) {}

  async execute(id: string, updatedBy: string): Promise<void> {
    return this.repo.activate(id, updatedBy);
  }
}
