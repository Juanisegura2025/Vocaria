import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isVoice?: boolean;
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
  isAgentSpeaking = false
}) => {
  const [inputText, setInputText] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!voiceMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [voiceMode]);

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

  const getVoiceButtonIcon = () => {
    switch (voiceState) {
      case 'connecting': return '⏳';
      case 'connected': return '🎤';
      case 'listening': return '🔴';
      case 'speaking': return '🔊';
      case 'error': return '⚠️';
      case 'disconnected': return '🎤';
      default: return '🎤';
    }
  };

  const isVoiceDisabled = voiceState === 'connecting' || voiceState === 'listening' || voiceState === 'speaking';

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="agent-info">
          <div className="agent-avatar">
            <span>{agentName[0]}</span>
          </div>
          <div className="agent-details">
            <h3>{agentName}</h3>
            <span className="agent-status">
              {voiceMode ? (
                <>
                  {getVoiceButtonIcon()} {getVoiceButtonText()}
                </>
              ) : (
                '💬 Chat'
              )}
            </span>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Voice Mode Indicator */}
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
            {voiceState === 'error' && (
              <div className="voice-error">
                <span>⚠️ Error de conexión de voz</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList 
        messages={messages} 
        isTyping={isTyping} 
        agentName={agentName}
      />

      {/* Lead Form */}
      {showLeadForm && (
        <div className="lead-form-overlay">
          <div className="lead-form">
            <div className="lead-form-header">
              <h4>🏠 ¿Te interesa esta propiedad?</h4>
              <button 
                className="close-lead-form" 
                onClick={onCloseLeadForm}
              >
                ✕
              </button>
            </div>
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
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button">
                  📧 Recibir Información
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        {/* Voice Toggle */}
        <div className="voice-controls">
          {!voiceMode ? (
            <button 
              className="voice-toggle-button start-voice"
              onClick={onStartVoice}
              title="Cambiar a conversación por voz"
            >
              🎤 Usar Voz
            </button>
          ) : (
            <button 
              className="voice-toggle-button stop-voice"
              onClick={onStopVoice}
              disabled={isVoiceDisabled}
              title="Volver a chat de texto"
            >
              💬 Usar Texto
            </button>
          )}
        </div>

        {/* Text Input (hidden in voice mode) */}
        {!voiceMode && (
          <div className="text-input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Escribe tu mensaje para ${agentName}...`}
              className="message-input"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="send-button"
            >
              📤
            </button>
          </div>
        )}

        {/* Voice Instructions */}
        {voiceMode && (
          <div className="voice-instructions">
            {voiceState === 'connected' && (
              <p>🎤 <strong>Voz activa:</strong> Habla normalmente, el agente te escucha</p>
            )}
            {voiceState === 'listening' && (
              <p>🔴 <strong>Escuchando:</strong> Estás hablando...</p>
            )}
            {voiceState === 'speaking' && (
              <p>🔊 <strong>Agente hablando:</strong> Escucha la respuesta</p>
            )}
            {voiceState === 'error' && (
              <p>⚠️ <strong>Error:</strong> Problema con la conexión de voz</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;