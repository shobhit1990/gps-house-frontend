import React, { createContext, useContext } from "react";
import { useSelector, useDispatch } from "@/store/hooks";
import { selectIsAuthenticated, logout as logoutAction } from "@/store/slices/authSlice";

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();

  const login = () => {
    // Login is handled by the Login page via Redux
  };

  const logout = () => {
    dispatch(logoutAction());
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
