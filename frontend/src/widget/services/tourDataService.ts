export interface TourContext {
  tour_id: string;
  property_name: string;
  total_area: number;
  rooms: Array<{
    name: string;
    area: number;
  }>;
  agent_context: string;
  matterport_model_id: string;
}

export const fetchTourContext = async (tourId: string): Promise<TourContext> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/tours/${tourId}/context`
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tour context: ${response.status}`);
  }
  
  return await response.json();
};
