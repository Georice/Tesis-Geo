import { UsuarioRepository } from '../../../infrastructure/repositories/UsuarioRepository';

export const ToggleUserStatus = (
  id: string,
  estado: 'activo' | 'inactivo',
): Promise<{ mensaje: string }> =>
  estado === 'activo' ? UsuarioRepository.deactivate(id) : UsuarioRepository.activate(id);
