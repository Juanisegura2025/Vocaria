import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies with requests
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., redirect to login)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Unified API fetch function
export const fetchApi = async <T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    params?: any;
    headers?: Record<string, string>;
  } = { method: 'GET' }
): Promise<T> => {
  try {
    const response = await api({
      url: endpoint,
      method: options.method,
      data: options.data,
      params: options.params,
      headers: {
        ...options.headers,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific error status codes if needed
      if (error.response?.status === 401) {
        // Unauthorized - token expired or invalid
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw error.response?.data || error.message;
    }
    throw error;
  }
};

// Helper functions for common HTTP methods
export const get = <T = any>(endpoint: string, params?: any, headers?: Record<string, string>) =>
  fetchApi<T>(endpoint, { method: 'GET', params, headers });

export const post = <T = any>(endpoint: string, data?: any, headers?: Record<string, string>) =>
  fetchApi<T>(endpoint, { method: 'POST', data, headers });

export const put = <T = any>(endpoint: string, data?: any, headers?: Record<string, string>) =>
  fetchApi<T>(endpoint, { method: 'PUT', data, headers });

export const del = <T = any>(endpoint: string, headers?: Record<string, string>) =>
  fetchApi<T>(endpoint, { method: 'DELETE', headers });

export default api;
