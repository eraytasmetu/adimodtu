import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../api/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any; // Gerçekte buraya bir User arayüzü tanımlamak daha iyi olur
  loading: boolean;
  login: (token: string, userData?: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('authtoken');
      if (token) {
        try {
          const res = await api.get('/users/me');
          setUser(res.data);
          setIsAuthenticated(true);
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
  };

  const logout = () => {
    localStorage.removeItem('authtoken');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
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