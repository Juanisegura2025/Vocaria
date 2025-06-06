import React from 'react';

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

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  agentName: string;
  currentRoom?: { name: string; area?: number } | null;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  agentName,
  currentRoom
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageActions = (message: Message) => {
    if (message.isUser) return null;
    
    const content = message.content.toLowerCase();
    const actions = [];

    // Smart action detection based on message content
    if (content.includes('agendar') || content.includes('visita') || content.includes('cita')) {
      actions.push({
        icon: '📅',
        text: 'Agendar visita',
        action: () => console.log('Scheduling visit for:', message.id)
      });
    }

    if (content.includes('precio') || content.includes('costo') || content.includes('valor')) {
      actions.push({
        icon: '💰',
        text: 'Ver precios',
        action: () => console.log('Show pricing for:', message.id)
      });
    }

    if (content.includes('ubicación') || content.includes('dirección') || content.includes('zona')) {
      actions.push({
        icon: '📍',
        text: 'Ver ubicación',
        action: () => console.log('Show location for:', message.id)
      });
    }

    if (content.includes('contacto') || content.includes('agente') || content.includes('llamar')) {
      actions.push({
        icon: '📞',
        text: 'Contactar agente',
        action: () => console.log('Contact agent for:', message.id)
      });
    }

    return actions.length > 0 ? actions : null;
  };

  const getAgentAvatar = () => {
    return (
      <div 
        className="message-avatar agent-avatar"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'var(--weight-semibold)',
          flexShrink: 0,
          border: '2px solid white',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {agentName[0]?.toUpperCase()}
      </div>
    );
  };

  const getUserAvatar = () => {
    return (
      <div 
        className="message-avatar user-avatar"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--gray-400)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          fontWeight: 'var(--weight-semibold)',
          flexShrink: 0,
          border: '2px solid white',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        👤
      </div>
    );
  };

  const TypingIndicator = () => (
    <div className="message agent" style={{ marginBottom: 'var(--space-3)' }}>
      {getAgentAvatar()}
      <div className="message-content-wrapper">
        <div className="typing-indicator">
          <div className="typing-dots">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
        <div className="message-meta" style={{ 
          fontSize: '0.75rem', 
          color: 'var(--gray-400)', 
          marginTop: 'var(--space-1)',
          fontStyle: 'italic'
        }}>
          {agentName} está escribiendo...
        </div>
      </div>
    </div>
  );

  return (
    <div className="message-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {messages.map((message) => {
        const actions = getMessageActions(message);
        
        return (
          <div
            key={message.id}
            className={`message ${message.isUser ? 'user' : 'agent'}`}
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              alignItems: 'flex-start',
              maxWidth: '85%',
              alignSelf: message.isUser ? 'flex-end' : 'flex-start',
              flexDirection: message.isUser ? 'row-reverse' : 'row'
            }}
          >
            {/* Avatar */}
            {message.isUser ? getUserAvatar() : getAgentAvatar()}
            
            {/* Message Content */}
            <div className="message-content-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              
              {/* Room Context Badge */}
              {message.roomContext && !message.isUser && (
                <div 
                  className="room-context-badge"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--primary)',
                    background: 'var(--primary-50)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius)',
                    alignSelf: 'flex-start',
                    fontWeight: 'var(--weight-medium)',
                    border: '1px solid var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  📍 {message.roomContext.name}
                  {message.roomContext.area && ` (${message.roomContext.area} m²)`}
                </div>
              )}
              
              {/* Main Message Bubble */}
              <div className="message-content">
                {/* Voice Indicator */}
                {message.isVoice && (
                  <div 
                    className="voice-indicator"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      boxShadow: 'var(--shadow)',
                      border: '1px solid var(--gray-200)',
                      zIndex: 1
                    }}
                  >
                    🎤
                  </div>
                )}
                
                {/* Message Text */}
                <div 
                  className="message-text"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    lineHeight: '1.4'
                  }}
                >
                  {message.content}
                </div>
              </div>
              
              {/* Quick Actions */}
              {actions && (
                <div 
                  className="message-actions"
                  style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap',
                    marginTop: 'var(--space-1)'
                  }}
                >
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      className="action-button"
                      onClick={action.action}
                      style={{
                        background: 'white',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius)',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.8125rem',
                        fontWeight: 'var(--weight-medium)',
                        color: 'var(--gray-700)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontFamily: 'var(--font-primary)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'var(--primary-50)';
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = 'var(--gray-300)';
                        e.currentTarget.style.color = 'var(--gray-700)';
                      }}
                    >
                      <span>{action.icon}</span>
                      <span>{action.text}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Message Meta */}
              <div 
                className="message-meta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: '0.75rem',
                  color: 'var(--gray-400)',
                  marginTop: 'var(--space-1)',
                  alignSelf: message.isUser ? 'flex-end' : 'flex-start'
                }}
              >
                {!message.isUser && (
                  <span className="message-sender" style={{ fontWeight: 'var(--weight-medium)' }}>
                    {agentName}
                  </span>
                )}
                <span className="message-time">
                  {formatTime(message.timestamp)}
                </span>
                {message.isVoice && (
                  <span 
                    className="voice-badge"
                    style={{
                      background: 'var(--primary-50)',
                      color: 'var(--primary)',
                      padding: '0.125rem 0.375rem',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.6875rem',
                      fontWeight: 'var(--weight-medium)'
                    }}
                  >
                    Voz
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {isTyping && <TypingIndicator />}

      {/* Empty State */}
      {messages.length === 0 && (
        <div 
          className="empty-messages"
          style={{
            textAlign: 'center',
            padding: 'var(--space-8) var(--space-4)',
            color: 'var(--gray-500)'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🏠</div>
          <div style={{ fontWeight: 'var(--weight-medium)', marginBottom: 'var(--space-1)' }}>
            ¡Hola! Soy tu asesor virtual inmobiliario
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            Pregúntame sobre la propiedad, precios, ubicación o agenda una visita
          </div>
        </div>
      )}

      {/* Current Room Context at Bottom */}
      {currentRoom && messages.length > 0 && (
        <div 
          className="current-room-context"
          style={{
            background: 'var(--gray-50)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--gray-200)',
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: 'var(--gray-600)',
            marginTop: 'var(--space-2)'
          }}
        >
          <div style={{ fontWeight: 'var(--weight-medium)', color: 'var(--gray-700)' }}>
            📍 Actualmente en: {currentRoom.name}
          </div>
          {currentRoom.area && (
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              Superficie: {currentRoom.area} m²
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageList;