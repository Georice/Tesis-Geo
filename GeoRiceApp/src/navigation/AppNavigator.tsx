import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';

import LoginScreen       from '../screens/LoginScreen';
import DashboardScreen   from '../screens/DashboardScreen';
import ZonasScreen       from '../screens/ZonasScreen';
import ActividadesScreen from '../screens/ActividadesScreen';
import CapasScreen       from '../screens/CapasScreen';
import IniciarCicloScreen from '../screens/IniciarCicloScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4f0' }}>
        <ActivityIndicator size="large" color="#1a5c2a" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Dashboard"    component={DashboardScreen}    options={{ headerShown: false }} />
            <Stack.Screen name="Zonas"        component={ZonasScreen}        options={{ title: 'Zonas' }} />
            <Stack.Screen name="Actividades"  component={ActividadesScreen}  options={{ title: 'Actividades' }} />
            <Stack.Screen name="Capas"        component={CapasScreen}        options={{ title: 'Capas' }} />
            <Stack.Screen name="IniciarCiclo" component={IniciarCicloScreen} options={{ title: 'Iniciar Ciclo' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
