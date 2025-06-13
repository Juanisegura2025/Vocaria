import axios from 'axios';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username: string;
}

// ✅ FIXED: Configure axios instance with correct API URL
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ FIXED: Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ FIXED: Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Auth Service - Attempting login...');
      const response = await api.post<LoginResponse>('/api/auth/login', credentials);
      
      // Store the token in localStorage
      if (response.data?.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        console.log('✅ Auth Service - Token stored successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Auth Service - Login failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Login failed');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<User> {
    try {
      console.log('🔐 Auth Service - Attempting registration...');
      const response = await api.post<User>('/api/auth/register', userData);
      console.log('✅ Auth Service - Registration successful');
      return response.data;
    } catch (error) {
      console.error('❌ Auth Service - Registration failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.detail || 'Registration failed. Please try again.'
        );
      }
      throw new Error('An unexpected error occurred');
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    try {
      console.log('🔍 Auth Service - Getting current user...');
      const response = await api.get<User>('/api/auth/me');
      console.log('✅ Auth Service - Current user retrieved:', response.data.email);
      return response.data;
    } catch (error) {
      console.error('❌ Auth Service - Get current user failed:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Clear invalid token
        this.logout();
      }
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const hasToken = !!localStorage.getItem('access_token');
    console.log('🔍 Auth Service - Is authenticated:', hasToken);
    return hasToken;
  },

  /**
   * Logout user
   */
  logout(): void {
    console.log('🚪 Auth Service - Logging out...');
    localStorage.removeItem('access_token');
    console.log('✅ Auth Service - Token cleared');
  },

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  // ✅ ADDED: Debug method to test connection
  async testConnection(): Promise<any> {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Auth Service - Testing connection...');
      console.log('- API Base URL:', import.meta.env.VITE_API_URL);
      console.log('- Has token:', !!token);
      console.log('- Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      
      const response = await api.get('/api/auth/me');
      console.log('✅ Auth Service - Connection test successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Auth Service - Connection test failed:', error);
      throw error;
    }
  },

  // ✅ ADDED: Health check method
  async testHealth(): Promise<any> {
    try {
      console.log('🏥 Auth Service - Testing backend health...');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001'}/health`);
      console.log('✅ Auth Service - Health check successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Auth Service - Health check failed:', error);
      throw error;
    }
  }
};

// Default export for compatibility
export default authService; 