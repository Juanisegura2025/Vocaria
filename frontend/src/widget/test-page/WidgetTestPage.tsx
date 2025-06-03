import React, { useState } from 'react';
import VocariaWidget from '../VocariaWidget';

const WidgetTestPage: React.FC = () => {
  const [config, setConfig] = useState({
    primaryColor: '#2563EB',
    position: 'bottom-right' as const,
    agentName: 'Jorge',
    agentId: 'agent_01jwsmw7pcfp6r4hcebmbbnd43', // ✅ AGENT ID CONFIGURADO
    tourId: 'demo-tour'
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        marginBottom: '40px'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '10px'
        }}>
          🏠 Vocaria Widget Test Environment
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#64748b',
          marginBottom: '30px'
        }}>
          Testing environment para el widget embebible con voice integration
        </p>
        
        {/* Agent Status */}
        <div style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600' }}>
            🎤 ElevenLabs Agent Status
          </h3>
          <p style={{ margin: '0', opacity: '0.9' }}>
            <strong>Agent ID:</strong> {config.agentId}
          </p>
          <p style={{ margin: '4px 0 0 0', opacity: '0.9' }}>
            <strong>Voice:</strong> Jorge (Argentino) | <strong>Model:</strong> Flash v2.5 | <strong>Status:</strong> ✅ Ready
          </p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginBottom: '40px'
      }}>
        {/* Widget Configuration */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '20px'
          }}>
            ⚙️ Widget Configuration
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Primary Color
            </label>
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Position
            </label>
            <select
              value={config.position}
              onChange={(e) => setConfig({ ...config, position: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Agent Name
            </label>
            <input
              type="text"
              value={config.agentName}
              onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Tour ID
            </label>
            <input
              type="text"
              value={config.tourId}
              onChange={(e) => setConfig({ ...config, tourId: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* Testing Instructions */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '20px'
          }}>
            🧪 Testing Instructions
          </h3>
          
          <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#4b5563' }}>
            <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>Voice Testing:</h4>
            <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
              <li>Click widget → Should open chat panel</li>
              <li>Click "🎤 Usar Voz" → Should request microphone</li>
              <li>Allow microphone → Should show "Conectando..."</li>
              <li>Speak "Hola" → Should get voice response</li>
            </ul>

            <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>Lead Capture Testing:</h4>
            <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
              <li>Ask about property details</li>
              <li>Say "me interesa" or "quiero más información"</li>
              <li>Should trigger lead capture form</li>
              <li>Enter email → Should save lead</li>
            </ul>

            <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>Fallback Testing:</h4>
            <ul style={{ paddingLeft: '20px' }}>
              <li>Deny microphone → Should fallback to text</li>
              <li>Click "💬 Usar Texto" → Should switch modes</li>
              <li>Type messages → Should get responses</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Simulated Matterport Environment */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        position: 'relative',
        minHeight: '400px'
      }}>
        <h2 style={{ 
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '16px'
        }}>
          🏠 Simulación Tour Matterport
        </h2>
        <p style={{ 
          fontSize: '1.1rem',
          color: '#64748b',
          marginBottom: '30px'
        }}>
          Demo Apartment CABA - Este es el ambiente donde aparecería el widget
        </p>
        
        {/* Simulated room info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          padding: '16px 24px',
          borderRadius: '8px',
          display: 'inline-block',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            📍 Actualmente en: <strong>Living Room (25 m²)</strong>
          </span>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '30px'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '16px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>🛏️ Bedrooms</h4>
            <p style={{ margin: '0', color: '#6b7280' }}>2 habitaciones</p>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '16px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>🚿 Bathrooms</h4>
            <p style={{ margin: '0', color: '#6b7280' }}>2 baños</p>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '16px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>📐 Total Area</h4>
            <p style={{ margin: '0', color: '#6b7280' }}>75 m²</p>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '16px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>🚗 Parking</h4>
            <p style={{ margin: '0', color: '#6b7280' }}>1 cochera</p>
          </div>
        </div>
      </div>

      {/* Vocaria Widget */}
      <VocariaWidget
        primaryColor={config.primaryColor}
        position={config.position}
        agentName={config.agentName}
        agentId={config.agentId}
        tourId={config.tourId}
        greeting="¡Hola! Soy Jorge, tu asesor virtual inmobiliario. ¿Te puedo ayudar con información sobre esta increíble propiedad?"
      />
    </div>
  );
};

export default WidgetTestPage;