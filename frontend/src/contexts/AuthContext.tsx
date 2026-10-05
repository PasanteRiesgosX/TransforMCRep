import React, { createContext, useContext, useState, useEffect } from 'react';
import { clearAdminChatSessions } from '../services/adminChat.service';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  area: string;
  appRole: string; // "USER" | "ADMIN"
  position: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      clearAdminChatSessions();
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      clearAdminChatSessions();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    clearAdminChatSessions();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
