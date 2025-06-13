import apiClient from '../api/client';

export interface AnalyticsStats {
  total_leads: number;
  active_tours: number;
  total_tours: number;
  conversion_rate: number;
  leads_by_month: {
    month: string;
    leads: number;
    tours: number;
  }[];
  top_tours: {
    tour_name: string;
    leads_count: number;
  }[];
  recent_activity: {
    type: string;
    description: string;
    email?: string;
    created_at: string;
    tour_name: string;
  }[];
  date_range: {
    start: string;
    end: string;
  };
}

export interface TourPerformance {
  tours: {
    tour_id: number;
    tour_name: string;
    is_active: boolean;
    leads_count: number;
    created_at: string;
    status: string;
  }[];
  total_tours: number;
  active_tours: number;
  total_leads: number;
}

class AnalyticsService {
  async getAnalyticsStats(startDate?: string, endDate?: string): Promise<AnalyticsStats> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await apiClient.get(`/api/analytics/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
      throw error;
    }
  }

  async getTourPerformance(): Promise<TourPerformance> {
    try {
      const response = await apiClient.get('/api/analytics/tour-performance');
      return response.data;
    } catch (error) {
      console.error('Error fetching tour performance:', error);
      throw error;
    }
  }

  // Calculate interaction time (simulate for now)
  calculateAverageInteractionTime(): string {
    // This would come from conversation transcripts in the future
    const minutes = Math.floor(Math.random() * 5) + 2; // 2-7 minutes
    const seconds = Math.floor(Math.random() * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Generate lead sources (simulate for now)
  generateLeadSources(): { source: string; percentage: number; color: string }[] {
    return [
      { source: 'Tours Virtuales', percentage: 57, color: '#3B82F6' },
      { source: 'Redes Sociales', percentage: 22, color: '#10B981' },
      { source: 'Sitio Web', percentage: 13, color: '#F59E0B' },
      { source: 'Referidos', percentage: 8, color: '#EF4444' }
    ];
  }
}

export const analyticsService = new AnalyticsService();