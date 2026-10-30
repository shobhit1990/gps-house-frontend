import type { MenuItem } from "./Menu";

export interface LoginResponse {
  message: string;
  userId: string;
  staffId?: string;
  username: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  menus?: MenuItem[];
  roleCode: string;
  roleName?: string;
}
