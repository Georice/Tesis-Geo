import AsyncStorage from '@react-native-async-storage/async-storage';
//import { Platform } from 'react-native';


// En desarrollo (Metro/dev build) usa la IP local; en un build de producción
// (__DEV__ === false) usa siempre el backend público. Reemplazar PROD_URL
// por la URL real una vez desplegado el backend (ver Railway).
// const LOCAL_URL = Platform.OS === 'android'
//   ? 'http://192.168.100.6:3000/api'
//   : 'http://localhost:3000/api';

//export const BASE_URL = 'https://vacancy-google-explain.ngrok-free.dev/api';

//produccion en nube
// export const BASE_URL = Platform.OS === 'android'
//   ? 'http://192.168.1.213:3000/api'
//   : 'http://localhost:3000/api';

//prox
// const PROD_URL = 'https://<tu-backend>.up.railway.app/api';

// export const BASE_URL = __DEV__ ? LOCAL_URL : PROD_URL;




//produccion en nube
export const BASE_URL = 'https://tesis-geo-production.up.railway.app/api';




export const STORAGE_KEYS = {
  ACCESS_TOKEN:    '@georice:access_token',
  REFRESH_TOKEN:   '@georice:refresh_token',
  USER:            '@georice:user',
  SYNC_DATA:       '@georice:sync_data',
  SYNC_TIMESTAMP:  '@georice:sync_timestamp',
  OFFLINE_QUEUE:   '@georice:offline_queue',
  // Registros creados/editados offline que ya se muestran en la UI con id
  // temporal, mientras su operación real sigue en OFFLINE_QUEUE.
  LOCAL_RECORDS:   '@georice:local_records',
  // Historial de operaciones offline (enviadas y pendientes) para la
  // pantalla "Estado de sincronización" — solo de lectura, no participa en
  // la lógica de reintento (eso lo maneja OFFLINE_QUEUE).
  SYNC_LOG:        '@georice:sync_log',
  // Caché aparte (no viaja en /api/sync): son datos solo para admin, no
  // tiene sentido mandarlos al dispositivo de cada socio.
  USUARIOS_CACHE:  '@georice:usuarios_cache',
} as const;

// Callback registrado por AuthContext para disparar logout global
// cuando el refresh token ya no es válido (sesión expirada o BD recreada).
let _forceLogout: (() => void) | null = null;

export function setForceLogoutCallback(fn: () => void): void {
  _forceLogout = fn;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
    STORAGE_KEYS.SYNC_DATA,
    STORAGE_KEYS.SYNC_TIMESTAMP,
    STORAGE_KEYS.USUARIOS_CACHE,
  ]);
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

// async function tryRefresh(): Promise<string | null> {
//   const raw = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
//   if (!raw) { await clearSession(); _forceLogout?.(); return null; }

//   try {
//     const res = await fetch(`${BASE_URL}/auth/refresh`, {
//       method:  'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body:    JSON.stringify({ refreshToken: raw }),
//     });
//     if (!res.ok) { await clearSession(); _forceLogout?.(); return null; }
//     const { accessToken, refreshToken } = await res.json();
//     await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
//     await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
//     return accessToken;
//   } catch {
//     return null;
//   }
// }


let _refreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;
  
  _refreshPromise = (async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!raw) { await clearSession(); _forceLogout?.(); return null; }

    try {
      // Ojo: si fetch() falla por falta de red, se deja propagar el error
      // (no se atrapa aquí). Antes se devolvía `null` en cualquier fallo,
      // lo que hacía que request() lanzara 'SESSION_EXPIRED' y forzara
      // logout aunque el problema fuera solo de conectividad — un desastre
      // para uso en campo con señal intermitente. Ahora solo se cierra la
      // sesión cuando el servidor SÍ respondió que el refresh token es
      // inválido; un fallo de red se distingue como tal más arriba.
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refreshToken: raw }),
      });
      if (!res.ok) { await clearSession(); _forceLogout?.(); return null; }
      const { accessToken, refreshToken } = await res.json();
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      return accessToken;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  let token = await getToken();

  const makeReq = (t: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let res = await makeReq(token);

  if (res.status === 401) {
    // Hay que drenar el body de esta respuesta antes de descartarla: si no
    // se lee, OkHttp deja la conexión "leaked" (nunca la devuelve al pool).
    // Con el refresh de token pasando esto en cada expiración de sesión
    // (cada 15 min de uso normal), las conexiones filtradas se acumulan y
    // terminan agotando el pool hacia el host — eso rompía después la
    // descarga de reportes (RNBlobUtil no conseguía conexión disponible).
    await res.text().catch(() => {});
    token = await tryRefresh();
    if (!token) throw new Error('SESSION_EXPIRED');
    res = await makeReq(token);
  }

  return res;
}

export const apiFetch = request;

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await request(path);
  if (!res.ok) {
    await res.text().catch(() => {});
    throw new Error(`GET ${path} falló: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
  const res = await request(path, { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `POST ${path} falló: ${res.status}`);
  }
  return res.json();
}

export async function apiPut<T = any>(path: string, body: unknown): Promise<T> {
  const res = await request(path, { method: 'PUT', body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `PUT ${path} falló: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await request(path, { method: 'DELETE' });
  await res.text().catch(() => {});
  if (!res.ok) throw new Error(`DELETE ${path} falló: ${res.status}`);
}
