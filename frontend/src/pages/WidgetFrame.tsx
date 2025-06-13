// frontend/src/pages/WidgetFrame.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import VocariaWidget from '../widget/VocariaWidget';

const WidgetFrame: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState({
    tourId: '',
    agentId: '',
    primaryColor: '#2563EB',
    greeting: "Hello! I'm your virtual real estate assistant. How can I help you today?",
    language: 'en',
    autoOpen: false
  });

  useEffect(() => {
    // Parse configuration from URL parameters
    const newConfig = {
      tourId: searchParams.get('tourId') || '',
      agentId: searchParams.get('agentId') || 'agent_01jwsmw7pcfp6r4hcebmbbnd43',
      primaryColor: searchParams.get('primaryColor') || '#2563EB',
      greeting: searchParams.get('greeting') || config.greeting,
      language: searchParams.get('language') || 'en',
      autoOpen: searchParams.get('autoOpen') === 'true'
    };
    
    setConfig(newConfig);

    // Auto-open if configured
    if (newConfig.autoOpen) {
      setTimeout(() => {
        // Trigger widget open
        const chatBubble = document.querySelector('.vocaria-widget button');
        if (chatBubble) {
          (chatBubble as HTMLButtonElement).click();
        }
      }, 1000);
    }
  }, [searchParams]);

  // Send messages to parent window
  const sendToParent = (type: string, payload?: any) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, payload }, '*');
    }
  };

  // Listen for lead capture events from widget
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'lead_captured') {
        sendToParent('vocaria:lead_capture', event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      background: 'transparent',
      overflow: 'hidden'
    }}>
      <VocariaWidget
        tourId={config.tourId}
        agentId={config.agentId}
        primaryColor={config.primaryColor}
        greeting={config.greeting}
        position="bottom-right"
        agentName={config.language === 'es' ? 'Jorge' : 'James'}
      />
      
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background: transparent;
          overflow: hidden;
        }
        
        /* Make widget fill the iframe */
        .vocaria-widget {
          position: fixed !important;
          bottom: 0 !important;
          right: 0 !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        /* Hide chat bubble in iframe mode */
        .vocaria-widget .chat-bubble {
          display: none !important;
        }
        
        /* Chat panel should be always open in iframe */
        .vocaria-widget .chat-panel {
          display: flex !important;
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
};

export default WidgetFrame;