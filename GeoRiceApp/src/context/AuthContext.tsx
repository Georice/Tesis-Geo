import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, STORAGE_KEYS, clearSession } from '../infrastructure/repositories/ApiClient';

export interface AuthUser {
  id:             number;
  cedula:         string;
  nombres:        string;
  apellidos:      string;
  usuario:        string;
  rol:            'administrador' | 'socio';
  nombreCompleto: string;
}

interface AuthContextValue {
  user:    AuthUser | null;
  loading: boolean;
  login:   (usuario: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.USER)
      .then(raw => { if (raw) setUser(JSON.parse(raw)); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (usuario: string, password: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ usuario, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).error || 'Credenciales incorrectas');
    }
    const { accessToken, refreshToken, usuario: payload } = await res.json();
    const fullUser: AuthUser = {
      id:             Number(payload.sub),
      cedula:         payload.cedula,
      nombres:        payload.nombres,
      apellidos:      payload.apellidos,
      usuario:        usuario,
      rol:            payload.rol,
      nombreCompleto: `${payload.nombres} ${payload.apellidos}`,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fullUser));
    setUser(fullUser);
  };

  const logout = async (): Promise<void> => {
    try {
      const token        = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (token && refreshToken) {
        await fetch(`${BASE_URL}/auth/logout`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ refreshToken }),
        });
      }
    } catch { /* best-effort */ }
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
