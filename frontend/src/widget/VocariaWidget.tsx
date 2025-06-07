import React, { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
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

const VocariaWidget: React.FC<WidgetConfig> = ({
  primaryColor = 'var(--primary)', // Using design system
  position = 'bottom-right',
  agentName = 'Jorge',
  agentId = '',
  tourId = 'demo-tour',
  greeting = '¡Hola! Soy tu asesor virtual inmobiliario. ¿En qué puedo ayudarte?'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<{ name: string; area?: number } | null>(null);
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
      const systemMessage: Message = {
        id: Date.now().toString() + '_voice_connected',
        content: 'Voz conectada. ¡Puedes hablar ahora!',
        isUser: false,
        timestamp: new Date(),
        isVoice: true
      };
      setMessages(prev => [...prev, systemMessage]);
    },
    onDisconnect: () => {
      console.log('🎤 Voice disconnected'); 
      setVoiceState('disconnected');
      setVoiceMode(false);
      
      // Add system message
      const systemMessage: Message = {
        id: Date.now().toString() + '_voice_disconnected',
        content: 'Conversación por voz finalizada. Puedes continuar escribiendo.',
        isUser: false,
        timestamp: new Date()
      };
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
      const errorMessage: Message = {
        id: Date.now().toString() + '_voice_error',
        content: 'Error en la conexión de voz. Puedes continuar con el chat de texto.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setTimeout(() => {
        setVoiceState('idle');
        setVoiceMode(false);
      }, 3000);
    }
  });

  // Initialize with greeting message
  useEffect(() => {
    const initialMessage: Message = {
      id: '1',
      content: greeting,
      isUser: false,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, [greeting]);

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
          const roomMessage: Message = {
            id: Date.now().toString() + '_room',
            content: `Has ingresado al ${randomRoom.name}${randomRoom.area ? ` (${randomRoom.area} m²)` : ''}.`,
            isUser: false,
            timestamp: new Date(),
            roomContext: randomRoom
          };
          setMessages(prev => [...prev, roomMessage]);
        }
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [isOpen, propertyData?.rooms]);

  const handleVoiceMessage = (voiceMessage: any) => {
    if (voiceMessage.type === 'user_transcript') {
      // User spoke
      if (voiceMessage.message && voiceMessage.message.trim()) {
        const userMessage: Message = {
          id: Date.now().toString(),
          content: voiceMessage.message,
          isUser: true,
          timestamp: new Date(),
          isVoice: true,
          roomContext: currentRoom || undefined
        };
        setMessages(prev => [...prev, userMessage]);
      }
    } else if (voiceMessage.type === 'agent_response') {
      // Agent responded
      if (voiceMessage.message) {
        const agentMessage: Message = {
          id: Date.now().toString() + '_agent',
          content: voiceMessage.message,
          isUser: false, 
          timestamp: new Date(),
          isVoice: true,
          roomContext: currentRoom || undefined
        };
        setMessages(prev => [...prev, agentMessage]);
        
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
      
      const errorMessage: Message = {
        id: Date.now().toString() + '_no_agent',
        content: 'Error: Agent ID no configurado. Contacta al administrador del sitio.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    try {
      setVoiceState('connecting');
      setVoiceMode(true);
      
      // Add connecting message
      const connectingMessage: Message = {
        id: Date.now().toString() + '_connecting',
        content: 'Conectando con el asistente de voz...',
        isUser: false,
        timestamp: new Date()
      };
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
      
      const fallbackMessage: Message = {
        id: Date.now().toString() + '_fallback',
        content: 'No se pudo iniciar la conversación por voz. Continúa con el chat de texto.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const stopVoiceConversation = () => {
    conversation.endSession();
    setVoiceMode(false);
    setVoiceState('idle');
  };

  const sendTextMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      isUser: true,
      timestamp: new Date(),
      roomContext: currentRoom || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

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
      const agentMessage: Message = {
        id: Date.now().toString() + '_agent',
        content: getContextualResponse(),
        isUser: false,
        timestamp: new Date(),
        roomContext: currentRoom || undefined
      };

      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);

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
      
      const thankYouMessage: Message = {
        id: Date.now().toString() + '_thanks',
        content: `¡Gracias ${leadData.email.split('@')[0]}! Un agente especializado se pondrá en contacto contigo pronto para coordinar una visita y brindarte toda la información que necesites.`,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, thankYouMessage]);
      setShowLeadForm(false);
      
      // In real implementation, call your backend:
      // await leadsService.createLead({ 
      //   email: leadData.email, 
      //   phone: leadData.phone,
      //   tourId: tourId,
      //   roomContext: currentRoom,
      //   source: voiceMode ? 'voice' : 'text'
      // });
      
    } catch (error) {
      console.error('Failed to save lead:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString() + '_lead_error',
        content: 'Hubo un problema al guardar tu información. Por favor, intenta nuevamente o contacta directamente al agente.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Enhanced widget styling with design system
  const widgetStyle = React.useMemo(() => ({
    '--widget-primary': primaryColor,
    '--widget-primary-light': primaryColor.replace(')', ', 0.8)').replace('var(--primary)', 'var(--primary-light)'),
    '--widget-primary-dark': primaryColor.replace(')', ', 1.2)').replace('var(--primary)', 'var(--primary-dark)'),
    '--widget-primary-50': primaryColor.replace(')', ', 0.1)').replace('var(--primary)', 'var(--primary-50)')
  } as React.CSSProperties), [primaryColor]);

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