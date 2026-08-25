export interface NavItem {
  path: string;
  label: string;
  icon: string;
  /** Permission key required to see this item (superadmin always sees all). */
  permission?: string;
  /** exact = only active when the URL matches exactly (used for the dashboard). */
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: 'dashboard', exact: true },
  { path: '/buildings', label: 'Buildings', icon: 'apartment', permission: 'building.read' },
  { path: '/flats', label: 'Flats', icon: 'home_work', permission: 'flat.read' },
  { path: '/members', label: 'Members', icon: 'groups', permission: 'member.read' },
  { path: '/roles', label: 'Roles', icon: 'admin_panel_settings', permission: 'role.read' },
  { path: '/permissions', label: 'Permissions', icon: 'lock', permission: 'permission.read' },
];
