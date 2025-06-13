import apiClient from '../../api/client';

export interface ConversationData {
  conversation_id: number;
  visitor_id: string;
  started_at: string;
}

export interface MessageData {
  message_id: number;
  timestamp: string;
}

class ConversationService {
  private conversationId: number | null = null;
  private visitorId: string | null = null;

  async startConversation(
    tourId: string,
    roomContext?: { name: string; area?: number }
  ): Promise<ConversationData> {
    try {
      const payload = {
        tour_id: parseInt(tourId),
        visitor_id: this.generateVisitorId(),
        room_context: roomContext,
        user_agent: navigator.userAgent
      };

      const response = await apiClient.post('/api/conversations/start', payload);
      const data = response.data;
      
      this.conversationId = data.conversation_id;
      this.visitorId = data.visitor_id;
      
      return data;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  async addMessage(
    content: string,
    isUser: boolean,
    messageType: 'text' | 'voice' | 'system' = 'text',
    roomContext?: { name: string; area?: number },
    audioDuration?: number,
    confidenceScore?: number
  ): Promise<MessageData> {
    if (!this.conversationId) {
      throw new Error('No active conversation');
    }

    try {
      const payload = {
        content,
        is_user: isUser,
        message_type: messageType,
        room_context: roomContext,
        audio_duration: audioDuration,
        confidence_score: confidenceScore
      };

      const response = await apiClient.post(
        `/api/conversations/${this.conversationId}/messages`,
        payload
      );
      
      return response.data;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  async endConversation(
    leadCaptured: boolean = false,
    visitorEmail?: string,
    visitorPhone?: string
  ): Promise<void> {
    if (!this.conversationId) {
      return;
    }

    try {
      const payload = {
        lead_captured: leadCaptured,
        visitor_email: visitorEmail,
        visitor_phone: visitorPhone
      };

      await apiClient.put(`/api/conversations/${this.conversationId}/end`, payload);
      
      // Reset conversation state
      this.conversationId = null;
      this.visitorId = null;
    } catch (error) {
      console.error('Error ending conversation:', error);
      // Don't throw error as this is cleanup
    }
  }

  private generateVisitorId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `visitor_${timestamp}_${random}`;
  }

  getConversationId(): number | null {
    return this.conversationId;
  }

  getVisitorId(): string | null {
    return this.visitorId;
  }

  isConversationActive(): boolean {
    return this.conversationId !== null;
  }
}

export const conversationService = new ConversationService();