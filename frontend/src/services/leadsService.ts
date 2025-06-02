import axios from 'axios';

// Types
export interface CreateLeadData {
  name: string;
  email: string;
  phone: string;
  message?: string;
  tour_id: string;
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

// Configure public API instance (no auth required)
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Service for managing leads
 */
class LeadsService {
  /**
   * Create a new lead (public endpoint)
   */
  async createLead(leadData: CreateLeadData): Promise<Lead> {
    try {
      const response = await publicApi.post<Lead>('/api/leads', leadData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.detail || 'Failed to submit lead form'
        );
      }
      throw new Error('An unexpected error occurred while submitting lead');
    }
  }
}

export const leadsService = new LeadsService();
