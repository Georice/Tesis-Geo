import { MenuItem } from '../../../domain/entities/MenuItem';

export const GetUserMenuByRole = (rol: 'administrador' | 'socio'): MenuItem[] => {
  const items: MenuItem[] = [
    { id: 'inicio', label: 'Inicio', icon: 'home', action: 'inicio' },
    { id: 'reportes', label: 'Reportes', icon: 'file-chart', action: 'reportes' },
  ];
  if (rol === 'administrador') {
    items.push({
      id: 'adminUsuarios',
      label: 'Administración de usuarios',
      icon: 'account-group',
      action: 'adminUsuarios',
    });
  }
  items.push({ id: 'logout', label: 'Cerrar sesión', icon: 'logout', action: 'logout' });
  return items;
};