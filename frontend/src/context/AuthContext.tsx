import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  ward: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cs_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data.data);
    } catch {
      setToken(null);
      localStorage.removeItem('cs_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('cs_token', t);
    setToken(t);
    setUser(u);
  };

  const register = async (data: RegisterData) => {
    const res = await authAPI.register(data);
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('cs_token', t);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    localStorage.removeItem('cs_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user,
      login, register, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
