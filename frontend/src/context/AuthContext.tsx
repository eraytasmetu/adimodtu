import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../api/api';

type UserProgress = null;

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  progress: UserProgress;
  loading: boolean;
  login: (token: string, userData?: any) => Promise<void>;
  logout: () => void;
  refreshProgress: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<UserProgress>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProgress = async () => {
    setProgress(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('authtoken');
      if (token) {
        try {
          const res = await api.get('/users/me');
          setUser(res.data);
          setIsAuthenticated(true);
          setProgress(null);
        } catch (err) {
          localStorage.removeItem('authtoken');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (token: string, userData?: any) => {
    localStorage.setItem('authtoken', token);
    setIsAuthenticated(true);
    setLoading(false);
    
    // If user data is provided, set it directly
    if (userData) {
      setUser(userData);
    } else {
      // Otherwise, fetch user info from API
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    }
    
    setProgress(null);
  };

  const logout = () => {
    localStorage.removeItem('authtoken');
    setUser(null);
    setProgress(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, progress, loading, login, logout, refreshProgress }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};