import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

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

// NEW: Interface for manual property data upload
export interface ManualPropertyData {
  property_name: string;
  description?: string;
  address_line1: string;
  city: string;
  state?: string;
  country: string;
  total_area: number;
  bedrooms: number;
  bathrooms: number;
  price?: number;
  currency?: string;
  property_type: string;
  amenities?: string;
  year_built?: number;
  parking_spaces?: number;
  rooms_detail?: string;
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

  // NEW: Upload manual property data
  async uploadPropertyData(tourId: number, propertyData: ManualPropertyData): Promise<Tour> {
    try {
      console.log('📤 Uploading manual property data for tour:', tourId);
      
      // Real API call
      const response = await apiClient.put<Tour>(
        `/api/tours/${tourId}/manual-data`,
        propertyData
      );
      console.log('✅ Property data uploaded successfully:', response.data);
      return response.data;
      
    } catch (error: unknown) {
      console.error('❌ Error uploading property data:', error);
      if (error instanceof AxiosError) {
        console.error('Upload error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
      throw error;
    }
  }

  // NEW: Upload property files (PDFs, images, etc.)
  async uploadPropertyFiles(tourId: number, files: File[]): Promise<any> {
    try {
      console.log('📤 Uploading property files for tour:', tourId);
      
      // For now, simulate the upload since backend endpoint might not exist yet
      // In production, uncomment the real API call below and remove the simulation
      
      /* Real API call (uncomment when backend is ready):
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      const response = await apiClient.post(
        `/api/tours/${tourId}/property/files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('✅ Files uploaded successfully:', response.data);
      return response.data;
      */
      
      // TEMPORARY: Simulate API call for testing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Files uploaded successfully (simulated):', files.map(f => f.name));
      return {
        message: `Successfully uploaded ${files.length} files`,
        files: files.map(f => ({
          filename: f.name,
          size: f.size,
          type: f.type
        })),
        tour_id: tourId
      };
      
    } catch (error: unknown) {
      console.error('❌ Error uploading files:', error);
      if (error instanceof AxiosError) {
        console.error('File upload error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
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