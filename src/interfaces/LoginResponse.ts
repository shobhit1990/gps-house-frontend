export interface LoginResponse {
  message: string;
  userId: string;
  staffId?: string;
  username: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  menus?: unknown[];
  roleCode: string;
  roleName?: string;
}
