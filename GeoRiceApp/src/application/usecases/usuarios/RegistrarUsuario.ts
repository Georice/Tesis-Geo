import { UsuarioRepository } from '../../../infrastructure/repositories/UsuarioRepository';
import { CreateUsuarioDto } from '../../../domain/entities/Usuario';

export const RegistrarUsuario = (data: CreateUsuarioDto): Promise<{ mensaje: string }> =>
  UsuarioRepository.register(data);
