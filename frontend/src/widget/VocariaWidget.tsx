import React, { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import ChatBubble from './components/ChatBubble';
import ChatPanel from './components/ChatPanel';
import './styles/widget.css';

export interface WidgetConfig {
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  agentName?: string;
  agentId?: string; // ElevenLabs Agent ID
  tourId?: string;
  greeting?: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isVoice?: boolean;
}

type VoiceState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'disconnected';

const VocariaWidget: React.FC<WidgetConfig> = ({
  primaryColor = '#2563EB',
  position = 'bottom-right',
  agentName = 'Sofia',
  agentId = '', // Will be set from ElevenLabs dashboard
  tourId = 'demo-tour',
  greeting = '¡Hola! Soy tu guía virtual. ¿En qué puedo ayudarte?'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<{ name: string; area?: number } | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [showLeadForm, setShowLeadForm] = useState(false);

  // ElevenLabs Conversation Hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('🎤 Voice connected');
      setVoiceState('connected');
    },
    onDisconnect: () => {
      console.log('🎤 Voice disconnected'); 
      setVoiceState('disconnected');
      setVoiceMode(false);
    },
    onMessage: (message: any) => {
      console.log('🎤 Voice message:', message);
      handleVoiceMessage(message);
    },
    onError: (error: any) => {
      console.error('🎤 Voice error:', error);
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 3000);
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

  // Room context simulation
  useEffect(() => {
    const rooms = [
      { name: 'Living Room', area: 25 },
      { name: 'Kitchen', area: 15 },
      { name: 'Bedroom', area: 20 },
      { name: 'Bathroom', area: 8 }
    ];
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
        setCurrentRoom(randomRoom);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleVoiceMessage = (voiceMessage: any) => {
    if (voiceMessage.type === 'user_transcript') {
      // User spoke
      if (voiceMessage.message && voiceMessage.message.trim()) {
        const userMessage: Message = {
          id: Date.now().toString(),
          content: voiceMessage.message,
          isUser: true,
          timestamp: new Date(),
          isVoice: true
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
          isVoice: true
        };
        setMessages(prev => [...prev, agentMessage]);
        
        // Check if agent is requesting contact info
        if (voiceMessage.message.toLowerCase().includes('contacto') || 
            voiceMessage.message.toLowerCase().includes('email') ||
            voiceMessage.message.toLowerCase().includes('teléfono')) {
          setShowLeadForm(true);
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
      alert('Agent ID no configurado. Contacta al administrador.');
      return;
    }

    try {
      setVoiceState('connecting');
      setVoiceMode(true);
      
      // Start conversation with ElevenLabs agent
      await conversation.startSession({ 
        agentId: agentId
      });
      
      console.log('🎤 Voice conversation started');
    } catch (error) {
      console.error('🎤 Failed to start voice:', error);
      setVoiceState('error');
      setVoiceMode(false);
      alert('No se pudo iniciar la conversación por voz. Usando chat de texto.');
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
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const responses = [
        `Claro, te puedo ayudar con información sobre ${currentRoom?.name || 'esta propiedad'}.`,
        `Esta es una excelente propiedad con ${currentRoom?.area || 'amplios'} metros cuadrados.`,
        `¿Te gustaría agendar una visita presencial? Puedo conectarte con un agente.`,
        `¡Perfecto! Para más información, ¿podrías dejarme tu email?`
      ];

      const agentMessage: Message = {
        id: Date.now().toString() + '_agent',
        content: responses[Math.floor(Math.random() * responses.length)],
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);

      // Randomly show lead form
      if (Math.random() > 0.6) {
        setTimeout(() => setShowLeadForm(true), 1000);
      }
    }, 1500);
  };

  const handleLeadSubmit = async (leadData: { email: string; phone?: string }) => {
    try {
      // Here you would integrate with your existing leadsService
      console.log('📧 Lead captured:', leadData);
      
      const thankYouMessage: Message = {
        id: Date.now().toString() + '_thanks',
        content: `¡Gracias ${leadData.email.split('@')[0]}! Un agente se pondrá en contacto contigo pronto.`,
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
      //   roomContext: currentRoom 
      // });
      
    } catch (error) {
      console.error('Failed to save lead:', error);
    }
  };

  const widgetStyle = {
    '--primary-color': primaryColor,
    '--primary-color-light': primaryColor + '20',
    '--primary-color-dark': primaryColor + 'DD'
  } as React.CSSProperties;

  return (
    <div 
      className={`vocaria-widget ${position}`}
      style={widgetStyle}
    >
      {/* Room Context Banner */}
      {currentRoom && isOpen && (
        <div className="room-context-banner">
          📍 Estás en: {currentRoom.name} 
          {currentRoom.area && ` (${currentRoom.area} m²)`}
        </div>
      )}

      {/* Chat Panel */}
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
        />
      )}

      {/* Chat Bubble */}
      <ChatBubble
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        hasNewMessage={messages.length > 1}
        voiceMode={voiceMode}
        voiceState={voiceState}
      />
    </div>
  );
};

export default VocariaWidget;