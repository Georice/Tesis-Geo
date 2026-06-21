import { UsuarioRepository } from '../../../infrastructure/repositories/UsuarioRepository';
import { CreateUsuarioDto, Usuario } from '../../../domain/entities/Usuario';

export const CreateUser = (data: CreateUsuarioDto): Promise<Usuario> =>
  UsuarioRepository.create(data);