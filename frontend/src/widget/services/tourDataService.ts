// Service to fetch real tour data from backend
export interface TourData {
  id: string;
  name: string;
  totalArea: number;
  rooms: Array<{
    name: string;
    area: number;
  }>;
}

export const fetchTourData = async (tourId: string): Promise<TourData> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tours/${tourId}/data`);
    if (!response.ok) {
      throw new Error('Failed to fetch tour data');
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch real tour data, using fallback:', error);
    // Fallback to demo data
    return {
      id: tourId,
      name: 'Get Started',
      totalArea: 73,
      rooms: [
        { name: 'Living', area: 35.5 },
        { name: 'Cocina', area: 12.8 },
        { name: 'Dormitorio Principal', area: 18.2 },
        { name: 'Baño', area: 6.5 }
      ]
    };
  }
};
