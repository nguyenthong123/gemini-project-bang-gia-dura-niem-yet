import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'hiephu_users';
const SESSION_KEY = 'hiephu_session';

interface StoredUser {
  email: string;
  passwordHash: string;
  name: string;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function getStoredUsers(): StoredUser[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.email && parsed.name) {
          setUser({ email: parsed.email, name: parsed.name });
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === email.toLowerCase().trim());

    if (!found) {
      return { success: false, error: 'Email chưa được đăng ký. Vui lòng tạo tài khoản mới.' };
    }

    if (found.passwordHash !== simpleHash(password)) {
      return { success: false, error: 'Mật khẩu không chính xác.' };
    }

    const sessionUser = { email: found.email, name: found.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return { success: true };
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !password || !trimmedName) {
      return { success: false, error: 'Vui lòng điền đầy đủ thông tin.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { success: false, error: 'Email không hợp lệ.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' };
    }

    const users = getStoredUsers();
    if (users.find(u => u.email === trimmedEmail)) {
      return { success: false, error: 'Email này đã được đăng ký.' };
    }

    const newUser: StoredUser = {
      email: trimmedEmail,
      passwordHash: simpleHash(password),
      name: trimmedName,
    };

    saveStoredUsers([...users, newUser]);

    const sessionUser = { email: newUser.email, name: newUser.name };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
