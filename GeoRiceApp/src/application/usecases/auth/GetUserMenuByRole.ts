import { MenuItem } from '../../../domain/entities/MenuItem';

export const GetUserMenuByRole = (rol: 'administrador' | 'socio'): MenuItem[] => {
  const items: MenuItem[] = [
    { id: 'inicio', label: 'Inicio', icon: '🏠', action: 'inicio' },
  ];
  if (rol === 'administrador') {
    items.push({
      id: 'adminUsuarios',
      label: 'Administración de usuarios',
      icon: '👥',
      action: 'adminUsuarios',
    });
  }
  items.push({ id: 'logout', label: 'Cerrar sesión', icon: '🚪', action: 'logout' });
  return items;
};