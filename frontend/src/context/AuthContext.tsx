import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

/**
 * Map raw backend JWT payload / /me response to frontend User type.
 * Backend returns: { _id, username, email, role: 'user'|'admin', ... }
 * Frontend User:   { id, name, email, role, ... }
 */
function mapBackendUser(raw: any): User {
  return {
    id: raw._id ?? raw.id ?? '',
    name: raw.username ?? raw.name ?? 'User',
    username: raw.username,
    email: raw.email ?? '',
    role: (raw.role as UserRole) ?? 'user',
    avatar: raw.avatar,
    createdAt: raw.createdAt,
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await authAPI.me();
      const raw = res.data?.data ?? res.data;
      setUser(mapBackendUser(raw));
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    await authAPI.login(email, password);
    await fetchMe();
  };

  const register = async (data: RegisterData) => {
    await authAPI.register(data);
    await fetchMe();
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch { /* ignore */ }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
