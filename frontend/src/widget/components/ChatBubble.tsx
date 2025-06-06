import React from 'react';

type VoiceState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'disconnected';

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
  hasNewMessage?: boolean;
  voiceMode?: boolean;
  voiceState?: VoiceState;
  unreadCount?: number;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  isOpen,
  onClick,
  hasNewMessage = false,
  voiceMode = false,
  voiceState = 'idle',
  unreadCount = 0
}) => {
  const getBubbleIcon = () => {
    if (isOpen) {
      return '✕';
    }
    
    if (voiceMode) {
      switch (voiceState) {
        case 'connecting':
          return '⏳';
        case 'connected':
          return '🎤';
        case 'listening':
          return '🔴';
        case 'speaking':
          return '🔊';
        case 'error':
          return '⚠️';
        case 'disconnected':
          return '🎤';
        default:
          return '🎤';
      }
    }
    
    // Changed from house to person icon for better UX
    return '👤';
  };

  const getBubbleClasses = () => {
    let classes = 'chat-bubble';
    
    if (hasNewMessage && !isOpen) {
      classes += ' has-new-message';
    }
    
    if (voiceMode) {
      classes += ' voice-mode';
      
      if (voiceState === 'listening') {
        classes += ' listening';
      }
      
      if (voiceState === 'speaking') {
        classes += ' speaking';
      }
      
      if (voiceState === 'error') {
        classes += ' error';
      }
    }
    
    return classes;
  };

  const getBubbleTitle = () => {
    if (isOpen) {
      return 'Cerrar chat';
    }
    
    if (voiceMode) {
      switch (voiceState) {
        case 'connecting':
          return 'Conectando voz...';
        case 'connected':
          return 'Voz conectada - Puedes hablar';
        case 'listening':
          return 'Escuchando - Te estoy oyendo';
        case 'speaking':
          return 'Agente hablando - Escucha la respuesta';
        case 'error':
          return 'Error de voz - Click para reintentar';
        case 'disconnected':
          return 'Voz desconectada - Click para abrir chat';
        default:
          return 'Click para iniciar conversación por voz';
      }
    }
    
    if (hasNewMessage) {
      return unreadCount > 1 
        ? `Tienes ${unreadCount} mensajes nuevos`
        : 'Tienes un mensaje nuevo';
    }
    
    return 'Habla con tu asesor virtual inmobiliario';
  };

  const getAriaLabel = () => {
    const baseLabel = isOpen ? 'Cerrar chat' : 'Abrir chat';
    
    if (voiceMode && !isOpen) {
      return `${baseLabel} - Modo voz activo`;
    }
    
    if (unreadCount > 0 && !isOpen) {
      return `${baseLabel} - ${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} nuevo${unreadCount > 1 ? 's' : ''}`;
    }
    
    return baseLabel;
  };

  return (
    <div className="chat-bubble-container" style={{ position: 'relative' }}>
      {/* Unread Count Badge */}
      {unreadCount > 0 && !isOpen && (
        <div 
          className="unread-badge"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--error)',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'var(--weight-semibold)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            border: '2px solid white',
            zIndex: 1,
            animation: 'badgePulse 2s ease-in-out infinite'
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}

      {/* Premium Status Ring for Voice Mode */}
      {voiceMode && !isOpen && (
        <div 
          className="voice-status-ring"
          style={{
            position: 'absolute',
            top: '-6px',
            left: '-6px',
            right: '-6px',
            bottom: '-6px',
            border: `3px solid ${
              voiceState === 'listening' ? 'var(--error)' : 
              voiceState === 'speaking' ? 'var(--success)' : 
              voiceState === 'connected' ? 'var(--primary)' : 
              voiceState === 'error' ? 'var(--warning)' : 
              'transparent'
            }`,
            borderRadius: '50%',
            animation: voiceState === 'listening' ? 'ringPulse 1.5s ease-in-out infinite' :
                      voiceState === 'speaking' ? 'ringGlow 1s ease-in-out infinite' : 
                      'none',
            zIndex: 0
          }}
        />
      )}

      {/* Main Chat Bubble */}
      <button
        className={getBubbleClasses()}
        onClick={onClick}
        title={getBubbleTitle()}
        aria-label={getAriaLabel()}
        style={{
          position: 'relative',
          zIndex: 1
        }}
      >
        <span 
          className="bubble-icon"
          style={{
            fontSize: voiceMode ? '1.375rem' : '1.5rem',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {getBubbleIcon()}
        </span>

        {/* Voice Activity Indicator */}
        {voiceMode && voiceState === 'listening' && (
          <div 
            className="voice-activity-indicator"
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '12px',
              height: '12px',
              background: 'var(--error)',
              borderRadius: '50%',
              animation: 'activityPulse 1s ease-in-out infinite',
              border: '2px solid white'
            }}
          />
        )}

        {/* Speaking Wave Animation */}
        {voiceMode && voiceState === 'speaking' && (
          <div 
            className="speaking-waves"
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              display: 'flex',
              gap: '2px',
              alignItems: 'flex-end'
            }}
          >
            <div style={{
              width: '3px',
              height: '8px',
              background: 'var(--success)',
              borderRadius: '2px',
              animation: 'speakingWave 0.8s ease-in-out infinite'
            }} />
            <div style={{
              width: '3px',
              height: '12px',
              background: 'var(--success)',
              borderRadius: '2px',
              animation: 'speakingWave 0.8s ease-in-out infinite 0.1s'
            }} />
            <div style={{
              width: '3px',
              height: '6px',
              background: 'var(--success)',
              borderRadius: '2px',
              animation: 'speakingWave 0.8s ease-in-out infinite 0.2s'
            }} />
          </div>
        )}
      </button>

      <style>{`
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes ringPulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1;
          }
          50% { 
            transform: scale(1.1); 
            opacity: 0.7;
          }
        }

        @keyframes ringGlow {
          0%, 100% { 
            opacity: 1;
            filter: brightness(1);
          }
          50% { 
            opacity: 0.8;
            filter: brightness(1.2);
          }
        }

        @keyframes activityPulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1;
          }
          50% { 
            transform: scale(1.3); 
            opacity: 0.7;
          }
        }

        @keyframes speakingWave {
          0%, 100% { 
            transform: scaleY(1); 
          }
          50% { 
            transform: scaleY(1.5); 
          }
        }

        .chat-bubble.speaking {
          animation: speakerBounce 1s ease-in-out infinite;
        }

        @keyframes speakerBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .chat-bubble.error {
          animation: errorShake 0.5s ease-in-out;
        }

        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }

        /* Enhanced hover effects */
        .chat-bubble:hover .bubble-icon {
          transform: scale(1.1);
        }

        .chat-bubble.voice-mode:hover .bubble-icon {
          transform: scale(1.05);
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .chat-bubble,
          .unread-badge,
          .voice-status-ring,
          .voice-activity-indicator,
          .speaking-waves > div,
          .bubble-icon {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatBubble;