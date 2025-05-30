import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

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

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        // In a real app, you would verify the session with your backend
        const token = localStorage.getItem('token');
        if (token) {
          // Mock user data - in a real app, fetch user data from your API
          setUser({
            id: '1',
            email: 'admin@vocaria.com',
            fullName: 'Admin User',
            role: 'admin',
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // In a real app, you would make an API call to your backend
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await response.json();
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock user data
      const mockUser = {
        id: '1',
        email: email,
        fullName: 'Admin User',
        role: 'admin',
        token: 'mock-jwt-token',
      };
      
      localStorage.setItem('token', mockUser.token);
      setUser(mockUser);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Failed to login. Please check your credentials.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
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
