import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

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

export interface User {
  id: number;
  authUserId?: string;
  staffId?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roleName?: string;
  roleId?: number;
  name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  menus: MenuItem[];
}

const loadAuthFromStorage = (): AuthState => {
  try {
    const token = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");
    const userStr = localStorage.getItem("user");
    const menusStr = localStorage.getItem("menus");
    const user = userStr ? JSON.parse(userStr) : null;
    const menus = menusStr ? JSON.parse(menusStr) : [];

    return {
      user,
      token,
      refreshToken,
      isAuthenticated: !!token,
      menus,
    };
  } catch (error) {
    console.error("Error loading auth from storage:", error);
    return {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      menus: [],
    };
  }
};

const initialState: AuthState = loadAuthFromStorage();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken?: string;
        menus?: MenuItem[];
      }>
    ) => {
      const { user, token, refreshToken, menus } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || null;
      state.isAuthenticated = true;
      state.menus = menus || [];

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (menus) localStorage.setItem("menus", JSON.stringify(menus));
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },

    setMenus: (state, action: PayloadAction<MenuItem[]>) => {
      state.menus = action.payload;
      localStorage.setItem("menus", JSON.stringify(action.payload));
    },

    updateTokens: (
      state,
      action: PayloadAction<{ token: string; refreshToken?: string }>
    ) => {
      const { token, refreshToken } = action.payload;
      state.token = token;
      state.isAuthenticated = true;
      if (refreshToken) state.refreshToken = refreshToken;
      localStorage.setItem("token", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.menus = [];
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("menus");
    },
  },
});

export const { setCredentials, updateUser, setMenus, logout, updateTokens } =
  authSlice.actions;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentToken = (state: RootState) => state.auth.token;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectMenus = (state: RootState) => state.auth.menus;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;

export default authSlice.reducer;
