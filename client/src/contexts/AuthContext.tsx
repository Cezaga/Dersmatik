import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar: string;
  level: number;
  xp: number;
  total_xp: number;
  streak_days: number;
  last_study_date: string | null;
  target_rank: number | null;
  target_department: string | null;
  daily_goal_minutes: number;
  daily_goal_questions: number;
  mood: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const u = await api.get<User>('/auth/me');
      setUser(u);
    } catch {
      localStorage.removeItem('dersmatik_token');
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('dersmatik_token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (login: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { login, password });
    localStorage.setItem('dersmatik_token', res.token);
    setUser(res.user);
  };

  const register = async (username: string, email: string, password: string, displayName: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', { username, email, password, displayName });
    localStorage.setItem('dersmatik_token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('dersmatik_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
