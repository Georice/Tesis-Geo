import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UpdateUsuarioDto, UsuarioResponseDto, toUsuarioResponseDto } from '../../dtos/usuarios/UsuarioDtos';

export class UpdateUsuario {
  constructor(private repo: IUserRepository) {}

  async execute(id: string, data: UpdateUsuarioDto): Promise<UsuarioResponseDto> {
    const usuario = await this.repo.update(id, data);
    return toUsuarioResponseDto(usuario);
  }
}
