import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

// Frontend User interface - independent of the auth service
interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

// Helper to map auth user to our app's user model
const mapAuthUserToUser = (authUser: { id: number; email: string; username: string }): User => ({
  id: authUser.id.toString(),
  email: authUser.email,
  fullName: authUser.username,
  role: 'user', // Default role, adjust as needed
});

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const authUser = await authService.getCurrentUser();
        setUser(mapAuthUserToUser(authUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      // If there's an error (e.g., token expired), clear the session
      authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is logged in
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      setUser(mapAuthUserToUser(response.user));
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to login. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
