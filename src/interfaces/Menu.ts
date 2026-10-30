export interface MenuPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  filter: boolean;
  print: boolean;
  excel: boolean;
}

export interface MenuItem {
  id: string;
  key: string;
  label: string;
  icon: string;
  url: string | null;
  isTitle: boolean;
  priority: number;
  parent: {
    id: string;
    key: string;
    label: string;
    icon: string;
  } | null;
  permissions: MenuPermissions;
  children: MenuItem[];
}
