import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';

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

interface ChatPanelProps {
  isOpen: boolean;
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  onClose: () => void;
  agentName: string;
  roomContext: RoomContext;
  primaryColor: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  messages,
  isTyping,
  onSendMessage,
  onClose,
  agentName,
  roomContext,
  primaryColor
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ email: '', phone: '' });
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      
      // Show lead form after 3 messages from visitor
      const visitorMessages = messages.filter(m => m.sender === 'visitor');
      if (visitorMessages.length >= 2) {
        setTimeout(() => setShowLeadForm(true), 2000);
      }
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (leadData.email) {
      try {
        // Here would be the real API call to save lead
        console.log('Lead captured:', { ...leadData, roomContext });
        
        // Success message
        onSendMessage(`Perfecto! Te contactaremos pronto a ${leadData.email}`);
        setShowLeadForm(false);
        setLeadData({ email: '', phone: '' });
      } catch (error) {
        console.error('Error saving lead:', error);
      }
    }
  };

  const quickResponses = [
    '¿Cuál es el precio?',
    '¿Puedo agendar una visita?',
    '¿Qué incluye la propiedad?',
    'Quiero más información'
  ];

  return (
    <div className={`vocaria-chat-panel ${isOpen ? 'vocaria-chat-panel--open' : ''}`}>
      {/* Header */}
      <div 
        className="vocaria-chat-panel__header"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="vocaria-chat-panel__agent-info">
          <div className="vocaria-chat-panel__avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4V6L13.5 7V8.5C13.5 8.8 13.3 9 13 9S12.5 8.8 12.5 8.5V7L11 6V4L5 7V9L6.5 8V18H8.5V12H10V18H12V20H14V18H15.5V8L21 9Z"/>
            </svg>
          </div>
          <div>
            <div className="vocaria-chat-panel__agent-name">{agentName}</div>
            <div className="vocaria-chat-panel__agent-status">
              <div className="vocaria-chat-panel__status-dot"></div>
              En línea
            </div>
          </div>
        </div>
        
        <button
          className="vocaria-chat-panel__close"
          onClick={onClose}
          aria-label="Cerrar chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/>
          </svg>
        </button>
      </div>

      {/* Room Context Banner */}
      {roomContext.roomName && (
        <div className="vocaria-chat-panel__room-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#6B7280">
            <path d="M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17M2 12L12 17L22 12"/>
          </svg>
          Estás en: {roomContext.roomName}
          {roomContext.area && ` (${roomContext.area} m²)`}
        </div>
      )}

      {/* Messages */}
      <div className="vocaria-chat-panel__messages">
        <MessageList 
          messages={messages} 
          isTyping={isTyping}
          agentName={agentName}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="vocaria-chat-panel__lead-overlay">
          <div className="vocaria-chat-panel__lead-form">
            <h3>¿Te contactamos con más información?</h3>
            <form onSubmit={handleLeadSubmit}>
              <input
                type="email"
                placeholder="Tu email"
                value={leadData.email}
                onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="vocaria-chat-panel__input"
              />
              <input
                type="tel"
                placeholder="Tu teléfono (opcional)"
                value={leadData.phone}
                onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
                className="vocaria-chat-panel__input"
              />
              <div className="vocaria-chat-panel__form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowLeadForm(false)}
                  className="vocaria-chat-panel__btn vocaria-chat-panel__btn--secondary"
                >
                  Después
                </button>
                <button 
                  type="submit"
                  className="vocaria-chat-panel__btn vocaria-chat-panel__btn--primary"
                  style={{ backgroundColor: primaryColor }}
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Responses */}
      {messages.length <= 2 && (
        <div className="vocaria-chat-panel__quick-responses">
          {quickResponses.map((response, index) => (
            <button
              key={index}
              className="vocaria-chat-panel__quick-response"
              onClick={() => onSendMessage(response)}
            >
              {response}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="vocaria-chat-panel__input-form">
        <div className="vocaria-chat-panel__input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu pregunta..."
            className="vocaria-chat-panel__message-input"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="vocaria-chat-panel__send-btn"
            style={{ color: primaryColor }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"/>
            </svg>
          </button>
        </div>
      </form>

      {/* Powered by Vocaria */}
      <div className="vocaria-chat-panel__footer">
        <span>Powered by <strong>Vocaria</strong></span>
      </div>
    </div>
  );
};

export default ChatPanel;