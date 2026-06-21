import { UsuarioRepository } from '../../../infrastructure/repositories/UsuarioRepository';
import { Usuario } from '../../../domain/entities/Usuario';

export const GetUsers = (): Promise<Usuario[]> => UsuarioRepository.getAll();