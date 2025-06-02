import React, { useState, useEffect } from 'react';
import ChatBubble from './components/ChatBubble';
import ChatPanel from './components/ChatPanel';
import './styles/widget.css';

interface VocariaWidgetProps {
  tourId?: string;
  tourToken?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  agentName?: string;
  greeting?: string;
}

interface RoomContext {
  roomName?: string;
  area?: number;
  coordinates?: { x: number; y: number; z: number };
}

interface Message {
  id: string;
  text: string;
  sender: 'agent' | 'visitor';
  timestamp: Date;
  roomContext?: RoomContext;
}

const VocariaWidget: React.FC<VocariaWidgetProps> = ({
  tourId = 'demo-tour',
  tourToken = '',
  position = 'bottom-right',
  primaryColor = '#2563EB',
  agentName = 'Guía Virtual',
  greeting = '¡Hola! Soy tu guía virtual. ¿En qué puedo ayudarte?'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomContext, setRoomContext] = useState<RoomContext>({});
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Initialize with greeting message
  useEffect(() => {
    const initialMessage: Message = {
      id: 'greeting',
      text: greeting,
      sender: 'agent',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  }, [greeting]);

  // Matterport SDK integration (detectar si está disponible)
  useEffect(() => {
    const checkMatterportSDK = () => {
      if (typeof window !== 'undefined' && (window as any).MP_SDK) {
        try {
          const sdk = (window as any).MP_SDK;
          // Listen for room changes
          sdk.on('rooms.current', (roomId: string) => {
            // Simulated room data - in real implementation would come from SDK
            const roomData = {
              roomName: `Habitación ${roomId.slice(-3)}`,
              area: Math.floor(Math.random() * 30) + 15, // 15-45 m²
            };
            setRoomContext(roomData);
            
            // Add room context message
            const roomMessage: Message = {
              id: `room-${Date.now()}`,
              text: `Ahora estás en: ${roomData.roomName} (${roomData.area} m²)`,
              sender: 'agent',
              timestamp: new Date(),
              roomContext: roomData,
            };
            
            if (isOpen) {
              setMessages(prev => [...prev, roomMessage]);
            } else {
              setHasNewMessage(true);
            }
          });
        } catch (error) {
          console.log('Matterport SDK detected but not fully loaded');
        }
      }
    };

    // Check immediately and then every 2 seconds for SDK
    checkMatterportSDK();
    const interval = setInterval(checkMatterportSDK, 2000);
    
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  const handleSendMessage = (text: string) => {
    // Add visitor message
    const visitorMessage: Message = {
      id: `visitor-${Date.now()}`,
      text,
      sender: 'visitor',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, visitorMessage]);
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const responses = [
        'Perfecto, ¿te gustaría agendar una visita presencial?',
        'Esta propiedad tiene excelentes características. ¿Qué información específica necesitas?',
        'Me alegra que te guste. ¿Quieres que te contacte un agente para más detalles?',
        'Excelente pregunta. ¿Te interesa conocer más sobre el precio y financiamiento?',
        '¡Genial! Esta zona tiene muchas ventajas. ¿Te gustaría dejar tus datos para más información?'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        text: randomResponse,
        sender: 'agent',
        timestamp: new Date(),
        roomContext,
      };
      
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const positionClass = `vocaria-widget--${position}`;

  return (
    <div 
      className={`vocaria-widget ${positionClass}`}
      style={{ '--primary-color': primaryColor } as React.CSSProperties}
    >
      <ChatBubble
        onClick={handleToggle}
        isOpen={isOpen}
        hasNewMessage={hasNewMessage}
        primaryColor={primaryColor}
      />
      
      <ChatPanel
        isOpen={isOpen}
        messages={messages}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
        onClose={() => setIsOpen(false)}
        agentName={agentName}
        roomContext={roomContext}
        primaryColor={primaryColor}
      />
    </div>
  );
};

export default VocariaWidget;