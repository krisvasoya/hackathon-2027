import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import { STORAGE_KEYS } from '../constants';
import type { User, UserRole } from '../types';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Auth Provider ────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } catch {
        // Token is invalid or expired — clear storage
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void validateSession();
  }, []);

  // ─── Login ──────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const { accessToken, user: loggedInUser } = await authService.login({
      email,
      password,
    });

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  // ─── Logout ─────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
    }
  }, []);

  // ─── Role Check ─────────────────────────────────────────────────────────

  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(user.role);
    },
    [user]
  );

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
