import React from 'react';

interface ChatBubbleProps {
  onClick: () => void;
  isOpen: boolean;
  hasNewMessage: boolean;
  primaryColor: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  onClick,
  isOpen,
  hasNewMessage,
  primaryColor
}) => {
  return (
    <button
      className={`vocaria-chat-bubble ${isOpen ? 'vocaria-chat-bubble--open' : ''} ${hasNewMessage ? 'vocaria-chat-bubble--notification' : ''}`}
      onClick={onClick}
      style={{ backgroundColor: primaryColor }}
      aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat con guía virtual'}
    >
      {/* Chat Icon - cuando está cerrado */}
      {!isOpen && (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="vocaria-chat-bubble__icon"
        >
          <path
            d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
            fill="white"
          />
          <circle cx="7" cy="10" r="1.5" fill="white" />
          <circle cx="12" cy="10" r="1.5" fill="white" />
          <circle cx="17" cy="10" r="1.5" fill="white" />
        </svg>
      )}

      {/* Close Icon - cuando está abierto */}
      {isOpen && (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="vocaria-chat-bubble__icon"
        >
          <path
            d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
            fill="white"
          />
        </svg>
      )}

      {/* Notification dot */}
      {hasNewMessage && !isOpen && (
        <div className="vocaria-chat-bubble__notification">
          <div className="vocaria-chat-bubble__pulse"></div>
        </div>
      )}

      {/* Voice wave animation when active */}
      <div className="vocaria-chat-bubble__wave">
        <div className="vocaria-chat-bubble__wave-ring"></div>
        <div className="vocaria-chat-bubble__wave-ring"></div>
        <div className="vocaria-chat-bubble__wave-ring"></div>
      </div>
    </button>
  );
};

export default ChatBubble;