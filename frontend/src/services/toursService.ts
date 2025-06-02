import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001';

export interface Tour {
  id: number;
  name: string;
  matterport_model_id: string;
  agent_id?: string;
  agent_objective: string;
  is_active: boolean;
  room_data?: any[];
  created_at: string;
  updated_at: string;
  leads_count?: number;
  scheduled_time?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  last_activity?: string;
  property_id?: string;
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
}

export interface CreateTourData {
  name: string;
  matterport_model_id: string;
  agent_objective?: string;
  is_active?: boolean;
}

class ToursService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        authService.logout();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getTours(): Promise<Tour[]> {
    try {
      return await this.makeRequest('/api/tours');
    } catch (error) {
      console.error('Error fetching tours:', error);
      throw error;
    }
  }

  async createTour(tourData: CreateTourData): Promise<Tour> {
    try {
      return await this.makeRequest('/api/tours', {
        method: 'POST',
        body: JSON.stringify(tourData),
      });
    } catch (error) {
      console.error('Error creating tour:', error);
      throw error;
    }
  }

  async deleteTour(tourId: number): Promise<void> {
    try {
      await this.makeRequest(`/api/tours/${tourId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting tour:', error);
      throw error;
    }
  }

  async getTourLeads(tourId: number): Promise<Lead[]> {
    try {
      return await this.makeRequest(`/api/tours/${tourId}/leads`);
    } catch (error) {
      console.error('Error fetching tour leads:', error);
      throw error;
    }
  }

  async createLead(leadData: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
    try {
      return await this.makeRequest('/api/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }
}

export const toursService = new ToursService();