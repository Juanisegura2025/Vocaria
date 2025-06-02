import axios from 'axios';
import { api } from './authService';

// Types
export interface Tour {
  id: string;
  property_id: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateTourData {
  property_id: string;
  scheduled_time: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  tour_id: string;
  created_at: string;
}

/**
 * Service for managing property tours
 */
class ToursService {
  /**
   * Get all tours for the authenticated user
   */
  async getTours(): Promise<Tour[]> {
    try {
      const response = await api.get<Tour[]>('/api/tours');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch tours');
      }
      throw new Error('An unexpected error occurred while fetching tours');
    }
  }

  /**
   * Create a new tour
   */
  async createTour(tourData: CreateTourData): Promise<Tour> {
    try {
      const response = await api.post<Tour>('/api/tours', tourData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to create tour');
      }
      throw new Error('An unexpected error occurred while creating tour');
    }
  }

  /**
   * Get leads for a specific tour
   */
  async getTourLeads(tourId: string): Promise<Lead[]> {
    try {
      const response = await api.get<Lead[]>(`/api/tours/${tourId}/leads`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.detail || 'Failed to fetch tour leads'
        );
      }
      throw new Error('An unexpected error occurred while fetching tour leads');
    }
  }
}

export const toursService = new ToursService();
