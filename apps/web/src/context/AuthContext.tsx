import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchCurrentUser, login as apiLogin, logout as apiLogout, signup as apiSignup } from "../api/auth";
import { getStoredUser } from "../lib/authStorage";
import type { AuthCredentials, SignupData, User } from "../types/auth";

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then((fetched) => {
        setUser(fetched ?? getStoredUser<User>());
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const { user: loggedInUser } = await apiLogin(credentials);
    setUser(loggedInUser);
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const { user: newUser } = await apiSignup(data);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
    }),
    [user, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
