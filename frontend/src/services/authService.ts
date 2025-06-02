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

// Configure axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
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

// Authentication service
export const authService = {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', credentials);
      // Store the token in localStorage
      if (response.data?.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      }
      return response.data;
    } catch (error) {
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
      const response = await api.post<User>('/api/auth/register', userData);
      return response.data;
    } catch (error) {
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
      const response = await api.get<User>('/api/auth/me');
      return response.data;
    } catch (error) {
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
    return !!localStorage.getItem('access_token');
  },

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('access_token');
    // Optional:  return api.get<{ message: string }>('/api/auth/logout');
  },

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  },
};

export default {
  api,
  login: authService.login,
  register: authService.register,
  getCurrentUser: authService.getCurrentUser,
  isAuthenticated: authService.isAuthenticated,
  logout: authService.logout,
  getToken: authService.getToken,
};
