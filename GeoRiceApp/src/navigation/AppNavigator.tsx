import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import DashboardScreen   from '../screens/DashboardScreen';
import ZonasScreen       from '../screens/ZonasScreen';
import ActividadesScreen from '../screens/ActividadesScreen';
import CapasScreen       from '../screens/CapasScreen';
import IniciarCicloScreen from '../screens/IniciarCicloScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard"    component={DashboardScreen}    options={{ headerShown: false }} />
      <Stack.Screen name="Zonas"        component={ZonasScreen}        options={{ title: 'Zonas' }} />
      <Stack.Screen name="Actividades"  component={ActividadesScreen}  options={{ title: 'Actividades' }} />
      <Stack.Screen name="Capas"        component={CapasScreen}        options={{ title: 'Capas' }} />
      <Stack.Screen name="IniciarCiclo" component={IniciarCicloScreen} options={{ title: 'Iniciar Ciclo' }} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;