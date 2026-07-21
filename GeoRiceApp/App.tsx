import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SyncEngine } from './src/infrastructure/sync/SyncEngine';

export default function App() {
  // Al recuperar señal en cualquier pantalla, sube lo que quedó pendiente
  // (parcelas/zonas/capas/actividades creadas o editadas offline) y refresca
  // la caché local con la respuesta del servidor.
  useEffect(() => {
    const unsubscribe = SyncEngine.subscribeConnectivity(() => {
      SyncEngine.flushQueue()
        .then(({ sent, pending }) => {
          if (sent > 0) {
            Alert.alert(
              'Sincronización',
              pending > 0
                ? `Se enviaron ${sent} cambio(s) pendiente(s). ${pending} quedaron por resolver.`
                : `Se enviaron ${sent} cambio(s) pendiente(s) guardados sin conexión.`,
            );
          }
        })
        .catch(() => {});
    });
    return unsubscribe;
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
