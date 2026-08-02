import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateUsuarioDto, UsuarioResponseDto, toUsuarioResponseDto } from '../../dtos/usuarios/UsuarioDtos';

export class CreateUsuario {
  constructor(private repo: IUserRepository) {}

  async execute(data: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    if (!data.nombre || !data.apellido || !data.cedula || !data.password) {
      throw new Error('nombre, apellido, cedula y password son requeridos');
    }
    const usuario = await this.repo.create(data);
    return toUsuarioResponseDto(usuario);
  }
}
