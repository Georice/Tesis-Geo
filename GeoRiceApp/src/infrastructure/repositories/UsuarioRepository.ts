import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, STORAGE_KEYS } from './ApiClient';
import { SyncEngine } from '../sync/SyncEngine';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../../domain/entities/Usuario';

// Los usuarios NO viajan en /api/sync (ese payload lo recibe cualquier
// usuario autenticado, y esto es información solo para admin). Se cachea
// aparte, únicamente para lectura: crear/editar/activar/desactivar son
// acciones administrativas y a propósito siguen exigiendo conexión.
//
// Igual que en los demás repositorios offline-aware: el try/catch cubre
// SOLO la llamada a apiFetch(...). Un error de negocio del servidor
// (!res.ok, p.ej. "La cédula ya existe") nunca se confunde con falta de
// conexión.
export const UsuarioRepository = {
  getAll: async (): Promise<Usuario[]> => {
    let res: Response;
    try {
      res = await apiFetch('/usuarios');
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.USUARIOS_CACHE);
      return cached ? JSON.parse(cached) : [];
    }
    if (!res.ok) {
      await res.text().catch(() => {});
      throw new Error(`GET /usuarios falló: ${res.status}`);
    }
    const data: Usuario[] = await res.json();
    await AsyncStorage.setItem(STORAGE_KEYS.USUARIOS_CACHE, JSON.stringify(data));
    return data;
  },

  // Auto-registro público (sin sesión): la cuenta queda inactiva hasta que
  // un administrador la habilite. No devuelve un Usuario completo, solo el
  // mensaje que se muestra en RegistroScreen.
  register: async (data: CreateUsuarioDto): Promise<{ mensaje: string }> => {
    let res: Response;
    try {
      res = await apiFetch('/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      throw new Error('Registrarse requiere conexión a internet. Intenta de nuevo cuando tengas señal.');
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al registrar usuario');
    return json;
  },

  create: async (data: CreateUsuarioDto): Promise<Usuario> => {
    let res: Response;
    try {
      res = await apiFetch('/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      throw new Error('Crear usuarios requiere conexión a internet. Intenta de nuevo cuando tengas señal.');
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al crear usuario');
    return json;
  },

  update: async (id: string, data: UpdateUsuarioDto): Promise<Usuario> => {
    let res: Response;
    try {
      res = await apiFetch(`/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      throw new Error('Editar usuarios requiere conexión a internet. Intenta de nuevo cuando tengas señal.');
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al actualizar usuario');
    return json;
  },

  activate: async (id: string): Promise<{ mensaje: string }> => {
    let res: Response;
    try {
      res = await apiFetch(`/usuarios/${id}/activar`, { method: 'PUT' });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      throw new Error('Activar usuarios requiere conexión a internet. Intenta de nuevo cuando tengas señal.');
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al activar usuario');
    return json;
  },

  deactivate: async (id: string): Promise<{ mensaje: string }> => {
    let res: Response;
    try {
      res = await apiFetch(`/usuarios/${id}/desactivar`, { method: 'PUT' });
    } catch (err) {
      if (!SyncEngine.isNetworkError(err)) throw err;
      throw new Error('Desactivar usuarios requiere conexión a internet. Intenta de nuevo cuando tengas señal.');
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error al desactivar usuario');
    return json;
  },
};
