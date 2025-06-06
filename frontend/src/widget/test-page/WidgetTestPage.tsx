import React, { useState } from 'react';
import VocariaWidget from '../VocariaWidget';

const WidgetTestPage: React.FC = () => {
  const [config, setConfig] = useState({
    primaryColor: 'var(--primary)', // Using design system
    position: 'bottom-right' as const,
    agentName: 'Jorge',
    agentId: 'agent_01jwsmw7pcfp6r4hcebmbbnd43',
    tourId: 'demo-tour'
  });

  const [testMode, setTestMode] = useState<'light' | 'dark' | 'contrast'>('light');

  const applyTestMode = (mode: 'light' | 'dark' | 'contrast') => {
    const root = document.documentElement;
    
    switch (mode) {
      case 'dark':
        root.style.background = '#1a1a1a';
        root.style.color = '#ffffff';
        break;
      case 'contrast':
        root.style.background = '#000000';
        root.style.color = '#ffffff';
        break;
      default:
        root.style.background = '#f8fafc';
        root.style.color = '#1e293b';
    }
  };

  React.useEffect(() => {
    applyTestMode(testMode);
  }, [testMode]);

  const colorPresets = [
    { name: 'Vocaria Blue', value: 'var(--primary)', color: '#2563EB' },
    { name: 'Success Green', value: 'var(--success)', color: '#10B981' },
    { name: 'Error Red', value: 'var(--error)', color: '#EF4444' },
    { name: 'Warning Orange', value: 'var(--warning)', color: '#F59E0B' },
    { name: 'Custom Purple', value: '#8B5CF6', color: '#8B5CF6' },
    { name: 'Real Estate Gold', value: 'var(--gold)', color: '#D97706' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: testMode === 'light' ? '#f8fafc' : testMode === 'dark' ? '#1a1a1a' : '#000000',
      padding: '20px',
      fontFamily: 'var(--font-primary)',
      transition: 'all 0.3s ease'
    }}>
      {/* Premium Header */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          color: 'white',
          padding: 'var(--space-8)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-8)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'var(--weight-bold)',
              margin: '0 0 var(--space-2) 0',
              lineHeight: 1.2
            }}>
              🏠 Vocaria Premium Widget
            </h1>
            <p style={{ 
              fontSize: '1.2rem', 
              margin: '0 0 var(--space-4) 0',
              opacity: 0.9,
              lineHeight: 1.4
            }}>
              Testing environment para el widget embebible con design system profesional
            </p>
            
            {/* Agent Status Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ 
                margin: '0 0 var(--space-2) 0', 
                fontSize: '1.1rem', 
                fontWeight: 'var(--weight-semibold)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                🎤 ElevenLabs Agent Status
                <span style={{
                  background: 'var(--success)',
                  color: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 'var(--weight-medium)'
                }}>
                  READY
                </span>
              </h3>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.4 }}>
                <strong>Agent ID:</strong> {config.agentId}<br />
                <strong>Voice:</strong> Jorge (Argentino) | <strong>Model:</strong> Flash v2.5 | <strong>Latency:</strong> ~75ms
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 'var(--space-8)',
        marginBottom: 'var(--space-8)'
      }}>
        
        {/* Widget Configuration */}
        <div style={{
          background: 'white',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--gray-900)',
            marginBottom: 'var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            ⚙️ Widget Configuration
          </h3>
          
          {/* Color Presets */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Color Presets
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 'var(--space-2)'
            }}>
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setConfig({ ...config, primaryColor: preset.value })}
                  style={{
                    background: config.primaryColor === preset.value ? preset.color : 'transparent',
                    color: config.primaryColor === preset.value ? 'white' : 'var(--gray-700)',
                    border: `2px solid ${preset.color}`,
                    borderRadius: 'var(--radius)',
                    padding: 'var(--space-2)',
                    fontSize: '0.8rem',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-primary)'
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Position
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {['bottom-right', 'bottom-left'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setConfig({ ...config, position: pos as any })}
                  style={{
                    background: config.position === pos ? 'var(--primary)' : 'white',
                    color: config.position === pos ? 'white' : 'var(--gray-700)',
                    border: '2px solid var(--primary)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--space-2) var(--space-3)',
                    fontSize: '0.875rem',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-primary)',
                    textTransform: 'capitalize'
                  }}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Name */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Agent Name
            </label>
            <input
              type="text"
              value={config.agentName}
              onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--gray-300)',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-primary)',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
            />
          </div>

          {/* Tour ID */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ 
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Tour ID
            </label>
            <input
              type="text"
              value={config.tourId}
              onChange={(e) => setConfig({ ...config, tourId: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '2px solid var(--gray-300)',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                fontFamily: 'var(--font-primary)',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
            />
          </div>

          {/* Test Mode */}
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--gray-700)',
              marginBottom: 'var(--space-2)'
            }}>
              Test Mode
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[
                { mode: 'light', label: '☀️ Light', color: '#f8fafc' },
                { mode: 'dark', label: '🌙 Dark', color: '#1a1a1a' },
                { mode: 'contrast', label: '⚫ High Contrast', color: '#000000' }
              ].map(({ mode, label, color }) => (
                <button
                  key={mode}
                  onClick={() => setTestMode(mode as any)}
                  style={{
                    background: testMode === mode ? color : 'white',
                    color: testMode === mode ? (mode === 'light' ? '#1a1a1a' : 'white') : 'var(--gray-700)',
                    border: `2px solid ${color}`,
                    borderRadius: 'var(--radius)',
                    padding: 'var(--space-2)',
                    fontSize: '0.8rem',
                    fontWeight: 'var(--weight-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-primary)'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div style={{
          background: 'white',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--gray-200)'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--gray-900)',
            marginBottom: 'var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            🧪 Premium Testing Guide
          </h3>
          
          <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--gray-700)' }}>
            
            <div style={{ 
              background: 'var(--success-50)', 
              padding: 'var(--space-3)', 
              borderRadius: 'var(--radius)',
              marginBottom: 'var(--space-4)',
              border: '1px solid var(--success-light)'
            }}>
              <h4 style={{ 
                color: 'var(--success)', 
                margin: '0 0 var(--space-2) 0',
                fontWeight: 'var(--weight-semibold)',
                fontSize: '1rem'
              }}>
                ✅ Voice Testing (Premium)
              </h4>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                <li>Click widget → Premium chat panel opens</li>
                <li>Click "🎤 Usar Voz" → Professional voice connection</li>
                <li>Allow microphone → Smooth "Conectando..." animation</li>
                <li>Speak "Hola" → Jorge responds with premium voice quality</li>
                <li>Voice states → Professional visual feedback</li>
              </ul>
            </div>

            <div style={{ 
              background: 'var(--primary-50)', 
              padding: 'var(--space-3)', 
              borderRadius: 'var(--radius)',
              marginBottom: 'var(--space-4)',
              border: '1px solid var(--primary-light)'
            }}>
              <h4 style={{ 
                color: 'var(--primary)', 
                margin: '0 0 var(--space-2) 0',
                fontWeight: 'var(--weight-semibold)',
                fontSize: '1rem'
              }}>
                💬 Lead Capture Testing
              </h4>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                <li>Ask about "precio" or "visita" → Smart lead form appears</li>
                <li>Say "me interesa" → Automatic lead capture trigger</li>
                <li>Enter email → Professional form validation</li>
                <li>Room context → Shows current room in lead data</li>
              </ul>
            </div>

            <div style={{ 
              background: 'var(--warning-50)', 
              padding: 'var(--space-3)', 
              borderRadius: 'var(--radius)',
              marginBottom: 'var(--space-4)',
              border: '1px solid var(--warning-light)'
            }}>
              <h4 style={{ 
                color: 'var(--warning)', 
                margin: '0 0 var(--space-2) 0',
                fontWeight: 'var(--weight-semibold)',
                fontSize: '1rem'
              }}>
                🎨 Design System Testing
              </h4>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                <li>Change colors → Instant design system updates</li>
                <li>Test different positions → Responsive behavior</li>
                <li>Try dark mode → Premium contrast handling</li>
                <li>Mobile responsive → Professional scaling</li>
              </ul>
            </div>

            <div style={{ 
              background: 'var(--gray-50)', 
              padding: 'var(--space-3)', 
              borderRadius: 'var(--radius)',
              border: '1px solid var(--gray-200)'
            }}>
              <h4 style={{ 
                color: 'var(--gray-700)', 
                margin: '0 0 var(--space-2) 0',
                fontWeight: 'var(--weight-semibold)',
                fontSize: '1rem'
              }}>
                🔄 Fallback Testing
              </h4>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-4)' }}>
                <li>Deny microphone → Graceful fallback to text</li>
                <li>Network issues → Professional error handling</li>
                <li>Switch voice ↔ text → Seamless mode transitions</li>
                <li>Room navigation → Dynamic context updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Matterport Environment */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-10)',
        textAlign: 'center',
        position: 'relative',
        minHeight: '400px',
        border: '1px solid var(--gray-200)'
      }}>
        <h2 style={{ 
          fontSize: '2rem',
          fontWeight: 'var(--weight-bold)',
          color: 'var(--gray-900)',
          marginBottom: 'var(--space-4)',
          lineHeight: 1.2
        }}>
          🏠 Demo Tour Inmobiliario
        </h2>
        <p style={{ 
          fontSize: '1.1rem',
          color: 'var(--gray-600)',
          marginBottom: 'var(--space-6)',
          lineHeight: 1.4
        }}>
          Apartamento Premium CABA - Ambiente donde aparecería el widget embebible
        </p>
        
        {/* Property Info Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-8)'
        }}>
          {[
            { icon: '🛏️', title: 'Dormitorios', value: '2 habitaciones' },
            { icon: '🚿', title: 'Baños', value: '2 baños completos' },
            { icon: '📐', title: 'Superficie', value: '75 m² totales' },
            { icon: '🚗', title: 'Cochera', value: '1 lugar cubierto' },
            { icon: '🏢', title: 'Piso', value: '8° piso con ascensor' },
            { icon: '📍', title: 'Ubicación', value: 'Palermo, CABA' }
          ].map((item, index) => (
            <div key={index} style={{ 
              background: 'white', 
              padding: 'var(--space-4)', 
              borderRadius: 'var(--radius)',
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--gray-200)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>
                {item.icon}
              </div>
              <h4 style={{ 
                margin: '0 0 var(--space-1) 0', 
                color: 'var(--gray-900)',
                fontWeight: 'var(--weight-semibold)',
                fontSize: '0.9rem'
              }}>
                {item.title}
              </h4>
              <p style={{ 
                margin: '0', 
                color: 'var(--gray-600)',
                fontSize: '0.8rem'
              }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Current Room Indicator */}
        <div style={{
          position: 'absolute',
          top: 'var(--space-4)',
          left: 'var(--space-4)',
          background: 'white',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--gray-200)',
          animation: 'pulse 3s ease-in-out infinite'
        }}>
          <div style={{ 
            fontSize: '0.875rem', 
            color: 'var(--gray-600)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            📍 <strong>Actualmente en: Living Room (25 m²)</strong>
          </div>
        </div>
      </div>

      {/* Premium Vocaria Widget */}
      <VocariaWidget
        primaryColor={config.primaryColor}
        position={config.position}
        agentName={config.agentName}
        agentId={config.agentId}
        tourId={config.tourId}
        greeting={`¡Hola! Soy ${config.agentName}, tu asesor virtual inmobiliario especializado. Estoy aquí para ayudarte a conocer todos los detalles de esta increíble propiedad. ¿En qué puedo asistirte?`}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default WidgetTestPage;