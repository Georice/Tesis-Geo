import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform }  from 'react-native';


//Parrales
// export const BASE_URL = Platform.OS === 'android'
//   ? 'http://192.168.100.6:3000/api'
//   : 'http://localhost:3000/api';


//Brando
export const BASE_URL = Platform.OS === 'android'
  ? 'http://192.168.1.213:3000/api'
  : 'http://localhost:3000/api';

export const STORAGE_KEYS = {
  ACCESS_TOKEN:    '@georice:access_token',
  REFRESH_TOKEN:   '@georice:refresh_token',
  USER:            '@georice:user',
  SYNC_DATA:       '@georice:sync_data',
  SYNC_TIMESTAMP:  '@georice:sync_timestamp',
  OFFLINE_QUEUE:   '@georice:offline_queue',
} as const;

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.USER,
    STORAGE_KEYS.SYNC_DATA,
    STORAGE_KEYS.SYNC_TIMESTAMP,
  ]);
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

async function tryRefresh(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!raw) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken: raw }),
    });
    if (!res.ok) { await clearSession(); return null; }
    const { accessToken, refreshToken } = await res.json();
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    return accessToken;
  } catch {
    return null;
  }
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
    token = await tryRefresh();
    if (!token) throw new Error('SESSION_EXPIRED');
    res = await makeReq(token);
  }

  return res;
}

export const apiFetch = request;

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await request(path);
  if (!res.ok) throw new Error(`GET ${path} falló: ${res.status}`);
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
  if (!res.ok) throw new Error(`DELETE ${path} falló: ${res.status}`);
}
