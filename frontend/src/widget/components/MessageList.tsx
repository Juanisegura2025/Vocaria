import React from 'react';

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

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  agentName: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  agentName
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const TypingIndicator = () => (
    <div className="vocaria-message vocaria-message--agent">
      <div className="vocaria-message__avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563EB">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4V6L13.5 7V8.5C13.5 8.8 13.3 9 13 9S12.5 8.8 12.5 8.5V7L11 6V4L5 7V9L6.5 8V18H8.5V12H10V18H12V20H14V18H15.5V8L21 9Z"/>
        </svg>
      </div>
      <div className="vocaria-message__content">
        <div className="vocaria-message__bubble vocaria-message__bubble--agent">
          <div className="vocaria-typing-indicator">
            <div className="vocaria-typing-dot"></div>
            <div className="vocaria-typing-dot"></div>
            <div className="vocaria-typing-dot"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="vocaria-message-list">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`vocaria-message vocaria-message--${message.sender}`}
        >
          {message.sender === 'agent' && (
            <div className="vocaria-message__avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563EB">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4V6L13.5 7V8.5C13.5 8.8 13.3 9 13 9S12.5 8.8 12.5 8.5V7L11 6V4L5 7V9L6.5 8V18H8.5V12H10V18H12V20H14V18H15.5V8L21 9Z"/>
              </svg>
            </div>
          )}
          
          <div className="vocaria-message__content">
            <div className={`vocaria-message__bubble vocaria-message__bubble--${message.sender}`}>
              {/* Room context indicator for room messages */}
              {message.roomContext && (
                <div className="vocaria-message__room-context">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17M2 12L12 17L22 12"/>
                  </svg>
                </div>
              )}
              
              <div className="vocaria-message__text">
                {message.text}
              </div>
              
              {/* Quick actions for agent messages */}
              {message.sender === 'agent' && message.text.includes('agendar') && (
                <div className="vocaria-message__actions">
                  <button className="vocaria-message__action-btn">
                    📅 Agendar visita
                  </button>
                </div>
              )}
              
              {message.sender === 'agent' && message.text.includes('precio') && (
                <div className="vocaria-message__actions">
                  <button className="vocaria-message__action-btn">
                    💰 Ver precio
                  </button>
                </div>
              )}
            </div>
            
            <div className="vocaria-message__meta">
              {message.sender === 'agent' && (
                <span className="vocaria-message__sender">{agentName}</span>
              )}
              <span className="vocaria-message__time">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
          
          {message.sender === 'visitor' && (
            <div className="vocaria-message__avatar vocaria-message__avatar--visitor">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#6B7280">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"/>
              </svg>
            </div>
          )}
        </div>
      ))}
      
      {isTyping && <TypingIndicator />}
    </div>
  );
};

export default MessageList;