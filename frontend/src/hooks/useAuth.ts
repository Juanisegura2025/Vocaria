import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const login = async (credentials: { email: string; password: string }) => {
    try {
      // Temporal login (sin JWT)
      const response = await api.post('/api/users/login', credentials);
      const userData = response.data as User;
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (credentials: { email: string; password: string; full_name: string }) => {
    try {
      const response = await api.post('/api/users/register', credentials);
      const userData = response.data as User;
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    queryClient.clear();
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return {
    user,
    login,
    register,
    logout,
  };
};
