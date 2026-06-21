import { apiGet, apiPost, apiPut } from './ApiClient';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../../domain/entities/Usuario';

export const UsuarioRepository = {
  getAll: (): Promise<Usuario[]> =>
    apiGet<Usuario[]>('/usuarios'),

  create: (data: CreateUsuarioDto): Promise<Usuario> =>
    apiPost<Usuario>('/usuarios', data),

  update: (id: number, data: UpdateUsuarioDto): Promise<Usuario> =>
    apiPut<Usuario>(`/usuarios/${id}`, data),

  activate: (id: number): Promise<{ mensaje: string }> =>
    apiPut<{ mensaje: string }>(`/usuarios/${id}/activar`, {}),

  deactivate: (id: number): Promise<{ mensaje: string }> =>
    apiPut<{ mensaje: string }>(`/usuarios/${id}/desactivar`, {}),
};