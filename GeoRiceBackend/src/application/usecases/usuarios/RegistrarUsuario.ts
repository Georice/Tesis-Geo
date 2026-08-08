import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateUsuarioDto, UsuarioResponseDto, toUsuarioResponseDto } from '../../dtos/usuarios/UsuarioDtos';

// Auto-registro público: a diferencia de CreateUsuario (admin), la cuenta
// siempre se crea inactiva — necesita que un administrador la habilite
// desde AdminUsuariosScreen antes de poder iniciar sesión.
export class RegistrarUsuario {
  constructor(private repo: IUserRepository) {}

  async execute(data: CreateUsuarioDto): Promise<UsuarioResponseDto> {
    if (!data.nombre || !data.apellido || !data.cedula || !data.password) {
      throw new Error('nombre, apellido, cedula y password son requeridos');
    }
    const usuario = await this.repo.create(data, false);
    return toUsuarioResponseDto(usuario);
  }
}
