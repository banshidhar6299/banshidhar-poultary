import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { registerAndSubscribePush } from '../utils/pushNotification';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isFarmer: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bp_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('bp_token', token);
      localStorage.setItem('bp_user', JSON.stringify(user));
      // Auto-subscribe to Web Push Notifications
      registerAndSubscribePush().catch((err) => console.error('Push registration error:', err));
    } else {
      localStorage.removeItem('bp_token');
      localStorage.removeItem('bp_user');
    }
    setLoading(false);
  }, [token, user]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('bp_token', newToken);
    localStorage.setItem('bp_user', JSON.stringify(newUser));
    // Trigger push registration on login
    setTimeout(() => {
      registerAndSubscribePush().catch((err) => console.error('Push registration error:', err));
    }, 500);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bp_token');
    localStorage.removeItem('bp_user');
    // Clear query caches if needed
    window.location.href = '/';
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updatedFields };
      setUser(updated);
      localStorage.setItem('bp_user', JSON.stringify(updated));
    }
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === 'ADMIN';
  const isFarmer = user?.role === 'FARMER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isFarmer,
        login,
        logout,
        updateUser,
        loading
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
