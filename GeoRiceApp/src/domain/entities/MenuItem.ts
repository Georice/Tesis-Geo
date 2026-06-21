export type MenuAction = 'inicio' | 'adminUsuarios' | 'logout';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action: MenuAction;
}
