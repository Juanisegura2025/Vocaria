import React, { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { conversationService } from './services/conversationService';
import ChatBubble from './components/ChatBubble';
import ChatPanel from './components/ChatPanel';
import { fetchTourContext, TourContext } from './services/tourDataService';
import './styles/widget.css';

export interface WidgetConfig {
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  agentName?: string;
  agentId?: string;
  tourId?: string;
  greeting?: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isVoice?: boolean;
  roomContext?: {
    name: string;
    area?: number;
  };
}

type VoiceState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'disconnected';

interface VocariaWidgetProps {
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  agentName?: string;
  agentId?: string;
  tourId?: string;
  greeting?: string;
}

const VocariaWidget: React.FC<VocariaWidgetProps> = ({
  primaryColor = 'var(--primary)',
  position = 'bottom-right',
  agentName = 'Jorge',
  agentId = '',
  tourId = 'demo-tour',
  greeting = '¡Hola! Soy tu asesor virtual inmobiliario. ¿En qué puedo ayudarte?'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  // Define Room interface for better type safety
  interface Room {
    name: string;
    area?: number;
  }
  
  const [currentRoom, setCurrentRoom] = useState<Room | undefined>(undefined);
  
  // Helper function to safely create room context
  const getRoomContext = (room: Room | undefined) => 
    room ? { name: room.name, area: room.area } : undefined;
    
  // Create a safe room context reference
  const roomContext = getRoomContext(currentRoom);
  
  // Helper function to safely use room context in message objects
  const createMessage = (
    content: string, 
    isUser: boolean, 
    isVoice = false, 
    customId?: string
  ): Message => ({
    id: customId || Date.now().toString(),
    content,
    isUser,
    timestamp: new Date(),
    isVoice,
    roomContext
  });
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [propertyData, setPropertyData] = useState<TourContext | null>(null);

  // ElevenLabs Conversation Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('🎤 Voice connected');
      setVoiceState('connected');
      
      // Add system message
      const systemMessage = createMessage(
        'Voz conectada. ¡Puedes hablar ahora!',
        false,
        true
      );
      setMessages(prev => [...prev, systemMessage]);
    },
    onDisconnect: () => {
      console.log('🎤 Voice disconnected'); 
      setVoiceState('disconnected');
      setVoiceMode(false);
      
      // Add system message
      const systemMessage = createMessage(
        'Conversación por voz finalizada. Puedes continuar escribiendo.',
        false,
        true
      );
      setMessages(prev => [...prev, systemMessage]);
    },
    onMessage: (message: any) => {
      console.log('🎤 Voice message:', message);
      handleVoiceMessage(message);
    },
    onError: (error: any) => {
      console.error('🎤 Voice error:', error);
      setVoiceState('error');
      
      // Add error message
      const errorMessage = createMessage(
        'Error en la conexión de voz. Puedes continuar con el chat de texto.',
        false,
        true
      );
      setMessages(prev => [...prev, errorMessage]);
      
      setTimeout(() => {
        setVoiceState('idle');
        setVoiceMode(false);
      }, 3000);
    }
  });

  // Initialize with greeting message
  useEffect(() => {
    const initialMessage = createMessage(greeting, false);
    setMessages([initialMessage]);
    
    // Track greeting message
    conversationService.addMessage(
      greeting, 
      false, 
      'system', 
      roomContext
    ).catch(console.error);
  }, [greeting]);
  
  // Conversation tracking
  useEffect(() => {
    let isMounted = true;
    
    const startConversationTracking = async () => {
      try {
        if (!conversationService.isConversationActive()) {
          await conversationService.startConversation(
            tourId || '1',
            currentRoom
          );
          
          if (isMounted) {
            console.log('📝 Conversation tracking started');
          }
        }
      } catch (error) {
        console.error('Failed to start conversation tracking:', error);
      }
    };
    
    if (isOpen && !conversationService.isConversationActive()) {
      startConversationTracking();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isOpen, tourId, currentRoom]);
  
  // Cleanup conversation on unmount
  useEffect(() => {
    return () => {
      if (conversationService.isConversationActive()) {
        conversationService.endConversation();
      }
    };
  }, []);

  // Load real property data from backend
  useEffect(() => {
    let isMounted = true;
    
    const loadPropertyData = async () => {
      try {
        const data = await fetchTourContext(tourId || '1');
        
        if (!isMounted) return;
        
        setPropertyData(data);
        
        // Set initial room to first real room
        if (data.rooms.length > 0) {
          setCurrentRoom({
            name: data.rooms[0].name,
            area: data.rooms[0].area
          });
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error loading property data:', error);
        // Fallback to demo data if API fails
        const fallbackData: TourContext = {
          tour_id: tourId || '1',
          property_name: 'Demo Property',
          total_area: 73.0,
          rooms: [
            { name: 'Living', area: 35.5 },
            { name: 'Cocina', area: 12.8 },
            { name: 'Dormitorio Principal', area: 18.2 },
            { name: 'Baño', area: 6.5 }
          ],
          agent_context: 'Demo property context',
          matterport_model_id: 'YKqfUWh6WN1'
        };
        setPropertyData(fallbackData);
        if (fallbackData.rooms.length > 0) {
          setCurrentRoom({
            name: fallbackData.rooms[0].name,
            area: fallbackData.rooms[0].area
          });
        }
      }
    };
    
    loadPropertyData();
    
    return () => {
      isMounted = false;
    };
  }, [tourId]);

  // Room context simulation with real data
  useEffect(() => {
    const rooms = propertyData?.rooms || [];
    
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && rooms.length > 0) { // Less frequent updates
        const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
        setCurrentRoom(randomRoom);
        
        // Add room context to current message if widget is open
        if (isOpen) {
          const roomMessage = createMessage(
            `Has ingresado al ${randomRoom.name}${randomRoom.area ? ` (${randomRoom.area} m²)` : ''}.`,
            false,
            false
          );
          setMessages(prev => [...prev, roomMessage]);
        }
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [isOpen, propertyData?.rooms]);

  const handleVoiceMessage = async (voiceMessage: any) => {
    if (voiceMessage.type === 'user_transcript') {
      if (voiceMessage.message?.trim()) {
        const userMessage = createMessage(
          voiceMessage.message,
          true,
          true
        );
        setMessages(prev => [...prev, userMessage]);
        
        // Track message in database
        try {
          await conversationService.addMessage(
            voiceMessage.message,
            true,
            'voice',
            roomContext,
            voiceMessage.audio_duration,
            voiceMessage.confidence_score
          );
        } catch (error) {
          console.error('Failed to track user voice message:', error);
        }
      }
    } else if (voiceMessage.type === 'agent_response') {
      if (voiceMessage.message) {
        const agentMessage = createMessage(
          voiceMessage.message,
          false,
          true
        );
        setMessages(prev => [...prev, agentMessage]);
        
        // Track agent message in database
        try {
          await conversationService.addMessage(
            voiceMessage.message,
            false,
            'voice',
            currentRoom || undefined,
            voiceMessage.response_duration
          );
        } catch (error) {
          console.error('Failed to track agent voice message:', error);
        }

        // Enhanced lead capture triggers
        const leadTriggers = [
          'contacto', 'email', 'teléfono', 'información',
          'me interesa', 'quiero saber más', 'agendar',
          'visita', 'precio', 'comprar', 'alquilar'
        ];
        
        const messageText = voiceMessage.message.toLowerCase();
        const hasLeadTrigger = leadTriggers.some(trigger => 
          messageText.includes(trigger)
        );
        
        if (hasLeadTrigger && !showLeadForm) {
          setTimeout(() => setShowLeadForm(true), 1500);
        }
      }
    } else if (voiceMessage.type === 'agent_thinking') {
      setVoiceState('listening');
    } else if (voiceMessage.type === 'agent_speaking_started') {
      setVoiceState('speaking');
    } else if (voiceMessage.type === 'agent_speaking_stopped') {
      setVoiceState('connected');
    }
  };

  const startVoiceConversation = async () => {
    if (!agentId) {
      console.error('🎤 No agent ID provided');
      
      const errorMessage = createMessage(
        'Error: Agent ID no configurado. Contacta al administrador del sitio.',
        false
      );
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    try {
      setVoiceState('connecting');
      setVoiceMode(true);
      
      // Add connecting message
      const connectingMessage = createMessage(
        'Conectando con el asistente de voz...',
        false
      );
      setMessages(prev => [...prev, connectingMessage]);
      
      // Start conversation with ElevenLabs agent
      await conversation.startSession({ 
        agentId: agentId
      });
      
      // Send dynamic property context to agent as a system message
      if (propertyData?.agent_context) {
        setTimeout(() => {
          // Use sendContextualUpdate to send system context to the agent
          conversation.sendContextualUpdate(
            `CONTEXTO DE LA PROPIEDAD: ${propertyData.agent_context}`
          );
        }, 1000);
      }
      
      console.log('🎤 Voice conversation started');
    } catch (error) {
      console.error('🎤 Failed to start voice:', error);
      setVoiceState('error');
      setVoiceMode(false);
      
      const fallbackMessage = createMessage(
        'No se pudo iniciar la conversación por voz. Continúa con el chat de texto.',
        false
      );
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const stopVoiceConversation = () => {
    conversation.endSession();
    setVoiceMode(false);
    setVoiceState('idle');
  };

  const sendTextMessage = (text: string) => {
    const userMessage = createMessage(text, true);
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Track user message in database
    if (conversationService.isConversationActive()) {
      conversationService.addMessage(
        text,
        true,
        'text',
        roomContext
      ).catch(error => {
        console.error('Failed to track user message:', error);
      });
    }

    // Enhanced agent responses with real estate context
    const getContextualResponse = () => {
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('precio') || lowerText.includes('costo')) {
        return `Para información sobre precios de ${currentRoom?.name || 'esta propiedad'}, un agente especializado te puede brindar detalles actualizados. ¿Te gustaría que te contacte?`;
      }
      
      if (lowerText.includes('tamaño') || lowerText.includes('metros') || lowerText.includes('m2')) {
        return `${currentRoom?.name || 'Esta área'} tiene ${currentRoom?.area || 'amplios'} metros cuadrados. ¿Te interesa conocer las dimensiones de otros ambientes?`;
      }
      
      if (lowerText.includes('ubicación') || lowerText.includes('barrio') || lowerText.includes('zona')) {
        return `Esta propiedad está en una excelente ubicación. ¿Te gustaría agendar una visita para conocer mejor la zona y sus servicios?`;
      }
      
      if (lowerText.includes('visita') || lowerText.includes('ver') || lowerText.includes('conocer')) {
        return `¡Perfecto! Me encantaría coordinar una visita para que puedas conocer toda la propiedad. ¿Podrías dejarme tu email para que un agente se contacte contigo?`;
      }
      
      // Default responses
      const responses = [
        `Excelente pregunta sobre ${currentRoom?.name || 'esta propiedad'}. Te puedo ayudar con toda la información que necesites.`,
        `Esta propiedad tiene características muy interesantes. ¿Te gustaría que un agente especializado te brinde más detalles?`,
        `¡Me alegra tu interés! Para darte la información más precisa, ¿podrías contarme qué es lo que más te importa en una propiedad?`,
        `Perfecto, puedo ayudarte con eso. ¿Te interesaría agendar una visita para conocer todos los detalles en persona?`
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
    };

    // Simulate agent response
    setTimeout(() => {
      const agentMessage = createMessage(
        getContextualResponse(),
        false
      );
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
      
      // Track agent response in database
      if (conversationService.isConversationActive()) {
        const responseText = getContextualResponse();
        conversationService.addMessage(
          responseText,
          false,
          'text',
          roomContext
        ).catch(error => {
          console.error('Failed to track agent response:', error);
        });
      }

      // Smart lead form trigger
      const leadTriggers = [
        'precio', 'visita', 'agendar', 'contacto', 'información',
        'interesa', 'comprar', 'alquilar', 'más detalles'
      ];
      
      const hasLeadTrigger = leadTriggers.some(trigger => 
        text.toLowerCase().includes(trigger)
      );
      
      if (hasLeadTrigger || Math.random() > 0.7) {
        setTimeout(() => setShowLeadForm(true), 2000);
      }
    }, 1000 + Math.random() * 1000); // Random delay for natural feel
  };

  const handleLeadSubmit = async (leadData: { email: string; phone?: string }) => {
    try {
      console.log('📧 Lead captured:', {
        ...leadData,
        tourId,
        roomContext: currentRoom,
        agentId,
        timestamp: new Date().toISOString()
      });
      
      // End conversation with lead capture
      await conversationService.endConversation(
        true,
        leadData.email,
        leadData.phone
      );
      
      const thankYouMessage = createMessage(
        `¡Gracias ${leadData.email.split('@')[0]}! Un agente especializado se pondrá en contacto contigo pronto para coordinar una visita y brindarte toda la información que necesites.`,
        false
      );
      setMessages(prev => [...prev, thankYouMessage]);
      setShowLeadForm(false);
      
      // Track message in database
      if (conversationService.isConversationActive()) {
        conversationService.addMessage(
          thankYouMessage.content,
          false,
          'text',
          roomContext
        ).catch(error => {
          console.error('Failed to track message:', error);
        });
      } else {
        console.warn('No active conversation to track message');
      }
      
    } catch (error) {
      console.error('Failed to save lead:', error);
      
      const errorMessage = createMessage(
        'Hubo un problema al guardar tu información. Por favor, intenta nuevamente o contacta directamente al agente.',
        false
      );
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Enhanced widget styling with design system
  // Create widget styles with proper type casting
  const widgetStyle: React.CSSProperties & Record<`--widget-${string}`, string> = {
    '--widget-primary': primaryColor,
    '--widget-primary-light': primaryColor.replace(')', ', 0.8)').replace('var(--primary)', 'var(--primary-light)'),
    '--widget-primary-dark': primaryColor.replace(')', ', 1.2)').replace('var(--primary)', 'var(--primary-dark)'),
    '--widget-primary-50': primaryColor.replace(')', ', 0.1)').replace('var(--primary)', 'var(--primary-50)')
  };
  
  return (
    <div 
      className={`vocaria-widget ${position}`}
      style={widgetStyle}
    >
      {/* Enhanced Room Context Banner */}
      {currentRoom && isOpen && (
        <div className="room-context-banner">
          📍 Estás en: <strong>{currentRoom.name}</strong>
          {currentRoom.area && ` (${currentRoom.area} m²)`}
        </div>
      )}

      {/* Premium Chat Panel */}
      {isOpen && (
        <ChatPanel
          messages={messages}
          isTyping={isTyping}
          onSendMessage={sendTextMessage}
          onClose={() => setIsOpen(false)}
          agentName={agentName}
          showLeadForm={showLeadForm}
          onLeadSubmit={handleLeadSubmit}
          onCloseLeadForm={() => setShowLeadForm(false)}
          // Voice props
          voiceMode={voiceMode}
          voiceState={voiceState}
          onStartVoice={startVoiceConversation}
          onStopVoice={stopVoiceConversation}
          isAgentSpeaking={conversation.isSpeaking}
          // Enhanced props
          currentRoom={currentRoom}
          tourId={tourId}
        />
      )}

      {/* Premium Chat Bubble */}
      <ChatBubble
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        hasNewMessage={messages.length > 1 && !isOpen}
        voiceMode={voiceMode}
        voiceState={voiceState}
        unreadCount={isOpen ? 0 : Math.max(0, messages.length - 1)}
      />
    </div>
  );
};

export default VocariaWidget;