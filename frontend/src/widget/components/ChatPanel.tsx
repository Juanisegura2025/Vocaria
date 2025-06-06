import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';

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

interface LeadFormData {
  email: string;
  phone?: string;
}

type VoiceState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'disconnected';

interface ChatPanelProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  agentName: string;
  showLeadForm: boolean;
  onLeadSubmit: (data: LeadFormData) => void;
  onCloseLeadForm: () => void;
  // Voice props
  voiceMode: boolean;
  voiceState: VoiceState;
  onStartVoice: () => void;
  onStopVoice: () => void;
  isAgentSpeaking?: boolean;
  // Enhanced props
  currentRoom?: { name: string; area?: number } | null;
  tourId?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isTyping,
  onSendMessage,
  onClose,
  agentName,
  showLeadForm,
  onLeadSubmit,
  onCloseLeadForm,
  voiceMode,
  voiceState,
  onStartVoice,
  onStopVoice,
  isAgentSpeaking = false,
  currentRoom,
  tourId
}) => {
  const [inputText, setInputText] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when not in voice mode
  useEffect(() => {
    if (!voiceMode && !showLeadForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [voiceMode, showLeadForm]);

  const handleSendMessage = () => {
    if (inputText.trim() && !voiceMode) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (leadEmail.trim()) {
      onLeadSubmit({
        email: leadEmail.trim(),
        phone: leadPhone.trim() || undefined
      });
      setLeadEmail('');
      setLeadPhone('');
    }
  };

  const getVoiceButtonText = () => {
    switch (voiceState) {
      case 'connecting': return 'Conectando...';
      case 'connected': return 'Conectado';
      case 'listening': return 'Escuchando...';
      case 'speaking': return 'Hablando...';
      case 'error': return 'Error - Reintentar';
      case 'disconnected': return 'Desconectado';
      default: return 'Iniciar Voz';
    }
  };

  const getVoiceStatusMessage = () => {
    switch (voiceState) {
      case 'connecting':
        return 'Estableciendo conexión con el asistente de voz...';
      case 'connected':
        return 'Voz activa - Puedes hablar normalmente';
      case 'listening':
        return 'Te estoy escuchando - Continúa hablando';
      case 'speaking':
        return 'El agente está respondiendo - Escucha la respuesta';
      case 'error':
        return 'Error en la conexión de voz - Intenta nuevamente';
      case 'disconnected':
        return 'Conversación de voz finalizada';
      default:
        return '';
    }
  };

  const isVoiceDisabled = voiceState === 'connecting' || voiceState === 'listening' || voiceState === 'speaking';

  // Fixed: Single icon display, no duplicates
  const getAgentStatusText = () => {
    if (voiceMode) {
      return getVoiceButtonText();
    }
    if (isTyping) {
      return 'Escribiendo...';
    }
    return 'En línea';
  };

  return (
    <div className="chat-panel">
      {/* Premium Header */}
      <div className="chat-header">
        <div className="agent-info">
          <div className="agent-avatar">
            <span>{agentName[0]?.toUpperCase()}</span>
          </div>
          <div className="agent-details">
            <h3>{agentName}</h3>
            <span className="agent-status">
              {getAgentStatusText()}
            </span>
          </div>
        </div>
        <button 
          className="close-button" 
          onClick={onClose}
          aria-label="Cerrar chat"
        >
          ✕
        </button>
      </div>

      {/* Premium Voice Mode Indicator */}
      {voiceMode && (
        <div className={`voice-mode-indicator ${voiceState}`}>
          <div className="voice-status">
            {voiceState === 'listening' && (
              <div className="listening-animation">
                <div className="sound-wave"></div>
                <div className="sound-wave"></div>
                <div className="sound-wave"></div>
              </div>
            )}
            {voiceState === 'speaking' && (
              <div className="speaking-animation">
                <div className="speaker-icon">🔊</div>
                <span>El agente está hablando...</span>
              </div>
            )}
            {voiceState === 'connected' && (
              <div className="voice-ready">
                <span>🎤 Voz activa - Puedes hablar</span>
              </div>
            )}
            {voiceState === 'connecting' && (
              <div className="voice-connecting">
                <span>⏳ Conectando con el asistente...</span>
              </div>
            )}
            {voiceState === 'error' && (
              <div className="voice-error">
                <span>⚠️ Error de conexión de voz</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Messages Container */}
      <div className="messages-container">
        <MessageList 
          messages={messages} 
          isTyping={isTyping} 
          agentName={agentName}
          currentRoom={currentRoom}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Lead Form */}
      {showLeadForm && (
        <div className="lead-form-overlay">
          <div className="lead-form">
            <div className="lead-form-header">
              <h4>🏠 ¿Te interesa esta propiedad?</h4>
              <button 
                className="close-lead-form" 
                onClick={onCloseLeadForm}
                aria-label="Cerrar formulario"
              >
                ✕
              </button>
            </div>
            <p style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '0.875rem', 
              color: 'var(--gray-600)',
              lineHeight: '1.4'
            }}>
              Déjanos tu información y un agente especializado te contactará para brindarte más detalles y coordinar una visita.
            </p>
            <form onSubmit={handleLeadSubmit}>
              <div className="form-group">
                <label htmlFor="lead-email">Email *</label>
                <input
                  id="lead-email"
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lead-phone">Teléfono (opcional)</label>
                <input
                  id="lead-phone"
                  type="tel"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  autoComplete="tel"
                />
              </div>
              {currentRoom && (
                <div style={{ 
                  background: 'var(--gray-50)', 
                  padding: 'var(--space-3)', 
                  borderRadius: 'var(--radius)', 
                  marginBottom: 'var(--space-4)',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-500)', 
                    marginBottom: '0.25rem',
                    fontWeight: 'var(--weight-medium)'
                  }}>
                    Interés en:
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: 'var(--gray-700)',
                    fontWeight: 'var(--weight-medium)'
                  }}>
                    📍 {currentRoom.name}
                    {currentRoom.area && ` (${currentRoom.area} m²)`}
                  </div>
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="submit-button">
                  📧 Recibir Información
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Input Area */}
      <div className="chat-input-area">
        {/* Premium Voice Controls */}
        <div className="voice-controls">
          {!voiceMode ? (
            <button 
              className="voice-toggle-button start-voice"
              onClick={onStartVoice}
              title="Cambiar a conversación por voz"
              aria-label="Iniciar conversación por voz"
            >
              🎤 Usar Voz
            </button>
          ) : (
            <button 
              className="voice-toggle-button stop-voice"
              onClick={onStopVoice}
              disabled={isVoiceDisabled}
              title="Volver a chat de texto"
              aria-label="Finalizar conversación por voz"
            >
              💬 Usar Texto
            </button>
          )}
        </div>

        {/* Premium Text Input */}
        {!voiceMode && (
          <div className="text-input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Pregunta sobre ${currentRoom?.name || 'la propiedad'}...`}
              className="message-input"
              disabled={isTyping}
              maxLength={500}
              autoComplete="off"
              aria-label={`Escribe tu mensaje para ${agentName}`}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="send-button"
              title="Enviar mensaje"
              aria-label="Enviar mensaje"
            >
              📤
            </button>
          </div>
        )}

        {/* Premium Voice Instructions */}
        {voiceMode && (
          <div className="voice-instructions">
            {voiceState === 'connected' && (
              <p>
                🎤 <strong>Voz activa:</strong> Habla normalmente, el agente te escucha y responderá automáticamente
              </p>
            )}
            {voiceState === 'listening' && (
              <p>
                🔴 <strong>Escuchando:</strong> Detectando tu voz... continúa hablando
              </p>
            )}
            {voiceState === 'speaking' && (
              <p>
                🔊 <strong>Agente respondiendo:</strong> Escucha la respuesta del asistente
              </p>
            )}
            {voiceState === 'connecting' && (
              <p>
                ⏳ <strong>Conectando:</strong> Estableciendo conexión con el asistente de voz...
              </p>
            )}
            {voiceState === 'error' && (
              <p>
                ⚠️ <strong>Error:</strong> Problema con la conexión. Intenta nuevamente o usa el chat de texto.
              </p>
            )}
            {voiceState === 'disconnected' && (
              <p>
                💬 <strong>Desconectado:</strong> La conversación por voz ha finalizado. Puedes continuar escribiendo.
              </p>
            )}
          </div>
        )}

        {/* Input Helper Text */}
        {!voiceMode && (
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--gray-400)',
            textAlign: 'center',
            marginTop: 'var(--space-2)'
          }}>
            {isTyping ? (
              'El agente está escribiendo...'
            ) : (
              `Presiona Enter para enviar • ${agentName} está aquí para ayudarte`
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;