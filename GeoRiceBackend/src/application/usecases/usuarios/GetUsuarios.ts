import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UsuarioResponseDto, toUsuarioResponseDto } from '../../dtos/usuarios/UsuarioDtos';

export class GetUsuarios {
  constructor(private repo: IUserRepository) {}

  async execute(): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.repo.findAll();
    return usuarios.map(toUsuarioResponseDto);
  }
}
