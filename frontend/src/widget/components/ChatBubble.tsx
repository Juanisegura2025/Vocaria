import React from 'react';

type VoiceState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'disconnected';

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
  hasNewMessage?: boolean;
  voiceMode?: boolean;
  voiceState?: VoiceState;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  isOpen,
  onClick,
  hasNewMessage = false,
  voiceMode = false,
  voiceState = 'idle'
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
    
    return '💬';
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
          return 'Voz conectada - Click para cerrar';
        case 'listening':
          return 'Escuchando - Puedes hablar';
        case 'speaking':
          return 'Agente hablando';
        case 'error':
          return 'Error de voz - Click para reintentar';
        case 'disconnected':
          return 'Voz desconectada';
        default:
          return 'Click para abrir chat con voz';
      }
    }
    
    return hasNewMessage ? 'Tienes un nuevo mensaje' : 'Abrir chat';
  };

  return (
    <button
      className={getBubbleClasses()}
      onClick={onClick}
      title={getBubbleTitle()}
      aria-label={getBubbleTitle()}
    >
      {getBubbleIcon()}
    </button>
  );
};

export default ChatBubble;