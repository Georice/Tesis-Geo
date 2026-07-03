import { UsuarioRepository } from '../../../infrastructure/repositories/UsuarioRepository';
import { UpdateUsuarioDto, Usuario } from '../../../domain/entities/Usuario';

export const UpdateUser = (id: string, data: UpdateUsuarioDto): Promise<Usuario> =>
  UsuarioRepository.update(id, data);
