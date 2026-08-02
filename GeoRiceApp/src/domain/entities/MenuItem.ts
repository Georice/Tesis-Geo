export type MenuAction = 'inicio' | 'reportes' | 'adminUsuarios' | 'logout';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action: MenuAction;
}
