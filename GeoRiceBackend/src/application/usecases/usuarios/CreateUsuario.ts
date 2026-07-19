import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateUsuarioDto, UsuarioResponseDto, toUsuarioResponseDto } from '../../dtos/usuarios/UsuarioDtos';

export class CreateUsuario {
  constructor(private repo: IUserRepository) {}

  async execute(data: CreateUsuarioDto, createdBy: string): Promise<UsuarioResponseDto> {
    if (!data.nombres || !data.apellidos || !data.cedula || !data.password) {
      throw new Error('nombres, apellidos, cedula y password son requeridos');
    }
    const usuario = await this.repo.create(
      { ...data, usuario: data.usuario ?? data.cedula },
      createdBy,
    );
    return toUsuarioResponseDto(usuario);
  }
}
