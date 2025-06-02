import React, { useState } from 'react';
import VocariaWidget from '../VocariaWidget';

const WidgetTestPage: React.FC = () => {
  const [widgetConfig, setWidgetConfig] = useState({
    tourId: 'demo-tour-123',
    tourToken: 'demo-token',
    position: 'bottom-right' as const,
    primaryColor: '#2563EB',
    agentName: 'María - Guía Virtual',
    greeting: '¡Hola! Soy María, tu guía virtual. ¿En qué puedo ayudarte con esta propiedad?'
  });

  const [showWidget, setShowWidget] = useState(true);
  const [matterportSimulation, setMatterportSimulation] = useState(false);

  // Simulate Matterport SDK room changes
  const simulateRoomChange = () => {
    const rooms = [
      { id: 'living', name: 'Living Room', area: 25 },
      { id: 'kitchen', name: 'Cocina', area: 15 },
      { id: 'bedroom', name: 'Dormitorio Principal', area: 20 },
      { id: 'bathroom', name: 'Baño', area: 8 }
    ];
    
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
    
    // Simulate SDK event
    if (matterportSimulation && (window as any).MP_SDK) {
      (window as any).MP_SDK.trigger('rooms.current', randomRoom.id);
    }
  };

  // Initialize mock Matterport SDK
  const initMockSDK = () => {
    if (typeof window !== 'undefined') {
      (window as any).MP_SDK = {
        events: {},
        on: function(event: string, callback: Function) {
          this.events[event] = callback;
        },
        trigger: function(event: string, data: any) {
          if (this.events[event]) {
            this.events[event](data);
          }
        }
      };
      setMatterportSimulation(true);
      console.log('Mock Matterport SDK initialized');
    }
  };

  const colorOptions = [
    { name: 'Azul Vocaria', value: '#2563EB' },
    { name: 'Verde Inmobiliario', value: '#10B981' },
    { name: 'Naranja Premium', value: '#F59E0B' },
    { name: 'Púrpura Moderno', value: '#8B5CF6' },
    { name: 'Rojo Elegante', value: '#EF4444' }
  ];

  const positionOptions = [
    { name: 'Abajo Derecha', value: 'bottom-right' },
    { name: 'Abajo Izquierda', value: 'bottom-left' },
    { name: 'Arriba Derecha', value: 'top-right' },
    { name: 'Arriba Izquierda', value: 'top-left' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#1F2937',
          marginBottom: '8px'
        }}>
          🎯 Vocaria Widget - Test Environment
        </h1>
        <p style={{ color: '#6B7280', fontSize: '16px' }}>
          Prueba el widget embebible con diferentes configuraciones
        </p>
      </div>

      {/* Controls Panel */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#1F2937',
          marginBottom: '16px'
        }}>
          🔧 Configuración del Widget
        </h2>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Agent Name */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '4px'
            }}>
              Nombre del Agente
            </label>
            <input
              type="text"
              value={widgetConfig.agentName}
              onChange={(e) => setWidgetConfig(prev => ({
                ...prev,
                agentName: e.target.value
              }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Primary Color */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '4px'
            }}>
              Color Primario
            </label>
            <select
              value={widgetConfig.primaryColor}
              onChange={(e) => setWidgetConfig(prev => ({
                ...prev,
                primaryColor: e.target.value
              }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              {colorOptions.map(color => (
                <option key={color.value} value={color.value}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '4px'
            }}>
              Posición
            </label>
            <select
              value={widgetConfig.position}
              onChange={(e) => setWidgetConfig(prev => ({
                ...prev,
                position: e.target.value as any
              }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              {positionOptions.map(pos => (
                <option key={pos.value} value={pos.value}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Greeting Message */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151',
            marginBottom: '4px'
          }}>
            Mensaje de Saludo
          </label>
          <textarea
            value={widgetConfig.greeting}
            onChange={(e) => setWidgetConfig(prev => ({
              ...prev,
              greeting: e.target.value
            }))}
            rows={2}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowWidget(!showWidget)}
            style={{
              padding: '10px 16px',
              background: showWidget ? '#EF4444' : '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {showWidget ? '🚫 Ocultar Widget' : '✅ Mostrar Widget'}
          </button>

          <button
            onClick={initMockSDK}
            disabled={matterportSimulation}
            style={{
              padding: '10px 16px',
              background: matterportSimulation ? '#6B7280' : '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: matterportSimulation ? 'not-allowed' : 'pointer'
            }}
          >
            {matterportSimulation ? '✅ SDK Activo' : '🎯 Activar Mock SDK'}
          </button>

          {matterportSimulation && (
            <button
              onClick={simulateRoomChange}
              style={{
                padding: '10px 16px',
                background: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🏠 Simular Cambio de Habitación
            </button>
          )}
        </div>
      </div>

      {/* Property Showcase Simulation */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#1F2937',
          marginBottom: '16px'
        }}>
          🏠 Simulación de Tour Inmobiliario
        </h2>

        {/* Property Info Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px'
        }}>
          <div style={{
            background: '#F9FAFB',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
              Apartment Premium CABA
            </h3>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '8px' }}>
              3 dormitorios • 2 baños • 85 m²
            </p>
            <p style={{ color: '#2563EB', fontSize: '18px', fontWeight: '700' }}>
              USD 285,000
            </p>
          </div>

          <div style={{
            background: '#F9FAFB',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
              Estado del Widget
            </h3>
            <p style={{ color: showWidget ? '#10B981' : '#EF4444', fontSize: '14px', marginBottom: '4px' }}>
              • Widget: {showWidget ? 'Activo' : 'Inactivo'}
            </p>
            <p style={{ color: matterportSimulation ? '#10B981' : '#6B7280', fontSize: '14px', marginBottom: '4px' }}>
              • SDK: {matterportSimulation ? 'Simulado' : 'No disponible'}
            </p>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              • Color: {widgetConfig.primaryColor}
            </p>
          </div>

          <div style={{
            background: '#F9FAFB',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', marginBottom: '8px' }}>
              Instrucciones de Prueba
            </h3>
            <p style={{ color: '#6B7280', fontSize: '12px', lineHeight: '1.4' }}>
              1. Haz clic en el widget flotante<br/>
              2. Envía algunos mensajes<br/>
              3. Prueba el cambio de habitación<br/>
              4. Completa el formulario de lead
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#EFF6FF',
          borderRadius: '8px',
          border: '1px solid #DBEAFE'
        }}>
          <p style={{ color: '#1E40AF', fontSize: '14px', margin: 0 }}>
            💡 <strong>Tip:</strong> Este entorno simula cómo se vería el widget embebido en un sitio de inmobiliaria real. 
            Prueba diferentes configuraciones y observa cómo cambia la experiencia del usuario.
          </p>
        </div>
      </div>

      {/* Render Widget */}
      {showWidget && (
        <VocariaWidget
          tourId={widgetConfig.tourId}
          tourToken={widgetConfig.tourToken}
          position={widgetConfig.position}
          primaryColor={widgetConfig.primaryColor}
          agentName={widgetConfig.agentName}
          greeting={widgetConfig.greeting}
        />
      )}
    </div>
  );
};

export default WidgetTestPage;