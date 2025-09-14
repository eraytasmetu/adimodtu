import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any; // Gerçekte buraya bir User arayüzü tanımlamak daha iyi olur
  loading: boolean;
  login: (token: string) => void;
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
        axios.defaults.headers.common['authtoken'] = token;
        try {
          const res = await axios.get('http://localhost:5757/api/users/me');
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('authtoken', token);
    axios.defaults.headers.common['authtoken'] = token;
    setIsAuthenticated(true);
    setLoading(false);
    // Optionally, fetch user info here if needed
  };

  const logout = () => {
    localStorage.removeItem('authtoken');
    delete axios.defaults.headers.common['authtoken'];
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