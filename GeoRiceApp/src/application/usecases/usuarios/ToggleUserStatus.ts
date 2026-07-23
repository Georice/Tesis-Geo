import { UsuarioRepository } from '../../../infrastructure/repositories/UsuarioRepository';

export const ToggleUserStatus = (
  id: string,
  activo: boolean,
): Promise<{ mensaje: string }> =>
  activo ? UsuarioRepository.deactivate(id) : UsuarioRepository.activate(id);
