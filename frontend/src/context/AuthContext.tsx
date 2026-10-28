import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Traffic Controller' | 'Police Officer' | 'City Administrator' | 'System Operator';
  department: string;
  badgeId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, department: string, password?: string) => Promise<boolean>;
  demoLogin: () => void;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'trafix_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      // Use sessionStorage so fresh visits to the website land on the Landing Page
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && saved !== 'null' && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.email) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved user', e);
    }
    // Default to unauthenticated (null) so visiting the site displays the Landing Page
    return null;
  });

  const login = async (email: string, password?: string): Promise<boolean> => {
    // Simulated realistic authentication
    const cleanName = email.includes('@')
      ? email.split('@')[0].replace('.', ' ')
      : email;
    const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: formattedName || 'Admin',
      email: email.includes('@') ? email : `${email}@trafix.gov.in`,
      role: 'City Administrator',
      department: 'Metropolitan Traffic Command',
      badgeId: `ADM-${Math.floor(100 + Math.random() * 900)}`,
    };
    setUser(newUser);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.removeItem(STORAGE_KEY);
    return true;
  };

  const register = async (name: string, email: string, department: string, password?: string): Promise<boolean> => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role: 'Traffic Controller',
      department: department || 'Metropolitan Traffic Command',
      badgeId: `TP-${Math.floor(100 + Math.random() * 900)}`,
    };
    setUser(newUser);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.removeItem(STORAGE_KEY);
    return true;
  };

  const demoLogin = () => {
    const demoUser: User = {
      id: 'usr_demo',
      name: 'Officer Vikram Sharma',
      email: 'v.sharma@trafix.gov.in',
      role: 'Traffic Controller',
      department: 'Central Traffic Control Division',
      badgeId: 'TP-DEL-892',
    };
    setUser(demoUser);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
    localStorage.removeItem(STORAGE_KEY);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    setUser(updated);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
