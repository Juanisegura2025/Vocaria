import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002';

// ✅ Crear instancia axios completamente independiente
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    // Obtener token directamente de localStorage
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

// ✅ Interceptor para manejar errores 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token y redirect sin importar authService
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface PropertyData {
  matterport_name?: string;
  matterport_description?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  total_area_floor?: number;
  total_area_floor_indoor?: number;
  dimension_units?: string;
  rooms_count?: number;
  rooms_summary?: string;
}

export interface Tour {
  id: number;
  name: string;
  matterport_model_id: string;
  agent_id?: string;
  agent_objective: string;
  is_active: boolean;
  room_data?: any[];
  created_at: string;
  updated_at?: string;
  leads_count?: number;
  scheduled_time?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  last_activity?: string;
  property_id?: string;
  
  // NUEVOS CAMPOS MATTERPORT
  matterport_data_imported?: boolean;
  matterport_share_url?: string;
  property_data?: PropertyData;
  import_status?: 'success' | 'partial' | 'failed' | 'not_configured' | 'pending';
}

export interface Lead {
  id: number;
  tour_id: number;
  name?: string;
  email: string;
  phone?: string;
  room_context?: {
    roomName?: string;
    area_m2?: number;
  };
  lead_data?: any;
  created_at: string;
  tour_name?: string;
}

export interface CreateTourData {
  name: string;
  matterport_model_id: string;
  agent_objective?: string;
  is_active?: boolean;
}

class ToursService {
  async getTours(): Promise<Tour[]> {
    try {
      console.log('🔍 Fetching tours...');
      const response = await apiClient.get<Tour[]>('/api/tours');
      console.log('✅ Tours fetched successfully:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Error fetching tours:', error);
      if (error instanceof AxiosError) {
        console.error('❌ Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }

  async createTour(tourData: CreateTourData): Promise<Tour> {
    try {
      console.log('🔍 Creating tour with data:', tourData);
      const response = await apiClient.post<Tour>('/api/tours', tourData);
      console.log('✅ Tour created successfully:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Error creating tour:', error);
      if (error instanceof AxiosError) {
        console.error('❌ Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }

  async getTour(tourId: number): Promise<Tour> {
    try {
      const response = await apiClient.get<Tour>(`/api/tours/${tourId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching tour:', error);
      throw error;
    }
  }

  async deleteTour(tourId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/tours/${tourId}`);
      console.log('✅ Tour deleted successfully');
    } catch (error: unknown) {
      console.error('❌ Error deleting tour:', error);
      throw error;
    }
  }

  async getTourLeads(tourId: number): Promise<Lead[]> {
    try {
      const response = await apiClient.get<Lead[]>(`/api/tours/${tourId}/leads`);
      return response.data;
    } catch (error: unknown) {
      console.error('Error fetching tour leads:', error);
      throw error;
    }
  }

  async createLead(leadData: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    try {
      const response = await apiClient.post<Lead>('/api/leads', leadData);
      return response.data;
    } catch (error: unknown) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  // ✅ MÉTODO DEBUG para verificar autenticación
  async testConnection(): Promise<any> {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Testing connection...');
      console.log('- API Base URL:', API_BASE_URL);
      console.log('- Has token:', !!token);
      console.log('- Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      
      const response = await apiClient.get('/api/auth/me');
      console.log('✅ Connection test successful:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Connection test failed:', error);
      if (error instanceof AxiosError) {
        console.log('Error status:', error.response?.status);
        console.log('Error data:', error.response?.data);
        console.log('Error headers sent:', error.config?.headers);
      }
      throw error;
    }
  }

  // ✅ MÉTODO para verificar health del backend
  async testBackend(): Promise<any> {
    try {
      console.log('🔍 Testing backend health...');
      const response = await apiClient.get('/health');
      console.log('✅ Backend health check successful:', response.data);
      return response.data;
    } catch (error: unknown) {
      console.error('❌ Backend health check failed:', error);
      if (error instanceof AxiosError) {
        console.log('Health check error details:', {
          status: error.response?.status,
          message: error.message,
          code: error.code
        });
      }
      throw error;
    }
  }
}

export const toursService = new ToursService();