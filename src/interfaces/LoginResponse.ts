import type { MenuItem } from "./Menu";

/** Body of /user/login after unwrapping the `{ message, data }` envelope. */
export interface LoginResponse {
  message?: string;
  externalId?: string;
  userId?: string;
  staffId?: string;
  userName?: string;
  username?: string;
  name: string;
  userType?: string;
  /** The backend sends the access token as `token`; `accessToken` is kept as a fallback. */
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  menus?: MenuItem[];
  roleCode?: string;
  roleName?: string;
}
