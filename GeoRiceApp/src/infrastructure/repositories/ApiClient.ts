import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android'
  ? 'http://localhost:3000/api'
  : 'http://localhost:3000/api';

export const apiFetch = async (path: string, options?: RequestInit): Promise<Response> => {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, options);
    return res;
 } catch {
    throw new Error(`No se pudo conectar: ${url}`);
  }
};

export const apiGet = async <T = any>(path: string): Promise<T> => {
  const res = await apiFetch(path);
  return res.json();
};