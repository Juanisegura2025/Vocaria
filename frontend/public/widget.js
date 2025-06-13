// public/widget.js - This file serves the widget to external sites

(function() {
    'use strict';
    
    // Configuration
    const WIDGET_URL = 'http://localhost:3000'; // Change in production
    const WIDGET_CONTAINER_ID = 'vocaria-widget-container';
    
    // Widget state
    let widgetConfig = {};
    let widgetInitialized = false;
    
    // Create global Vocaria function
    window.vocaria = window.vocaria || function(command, config) {
      if (command === 'init' && !widgetInitialized) {
        widgetConfig = config || {};
        initializeWidget();
      }
    };
    
    // Process queued commands
    if (window.vocaria.q) {
      window.vocaria.q.forEach(function(args) {
        window.vocaria.apply(null, args);
      });
    }
    
    function initializeWidget() {
      if (widgetInitialized) return;
      
      // Create container
      const container = document.createElement('div');
      container.id = WIDGET_CONTAINER_ID;
      container.style.cssText = 'position: fixed; z-index: 9999;';
      
      // Set position
      const position = widgetConfig.position || 'bottom-right';
      switch (position) {
        case 'bottom-left':
          container.style.bottom = '20px';
          container.style.left = '20px';
          break;
        case 'top-right':
          container.style.top = '20px';
          container.style.right = '20px';
          break;
        case 'top-left':
          container.style.top = '20px';
          container.style.left = '20px';
          break;
        default: // bottom-right
          container.style.bottom = '20px';
          container.style.right = '20px';
      }
      
      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.id = 'vocaria-widget-iframe';
      iframe.src = `${WIDGET_URL}/widget-frame?${buildQueryString(widgetConfig)}`;
      iframe.style.cssText = `
        width: 400px;
        height: 600px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 40px);
        border: none;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        background: white;
      `;
      
      // Responsive adjustments
      if (window.innerWidth <= 768) {
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.maxWidth = '100vw';
        iframe.style.maxHeight = '100vh';
        iframe.style.borderRadius = '0';
        container.style.bottom = '0';
        container.style.right = '0';
        container.style.left = '0';
        container.style.top = '0';
      }
      
      container.appendChild(iframe);
      document.body.appendChild(container);
      
      // Listen for messages from widget
      window.addEventListener('message', handleWidgetMessage);
      
      // Call onReady callback
      if (widgetConfig.onReady) {
        widgetConfig.onReady();
      }
      
      widgetInitialized = true;
    }
    
    function buildQueryString(config) {
      const params = new URLSearchParams();
      
      // Essential parameters
      params.append('tourId', config.tourId || '');
      params.append('agentId', config.agentId || 'agent_01jwsmw7pcfp6r4hcebmbbnd43');
      
      // Optional parameters
      if (config.primaryColor) params.append('primaryColor', config.primaryColor);
      if (config.greeting) params.append('greeting', config.greeting);
      if (config.language) params.append('language', config.language);
      if (config.autoOpen) params.append('autoOpen', config.autoOpen);
      
      return params.toString();
    }
    
    function handleWidgetMessage(event) {
      // Verify origin in production
      // if (event.origin !== WIDGET_URL) return;
      
      const data = event.data;
      
      switch (data.type) {
        case 'vocaria:lead_capture':
          if (widgetConfig.onLeadCapture) {
            widgetConfig.onLeadCapture(data.payload);
          }
          break;
          
        case 'vocaria:error':
          if (widgetConfig.onError) {
            widgetConfig.onError(data.payload);
          }
          break;
          
        case 'vocaria:resize':
          // Handle widget resize if needed
          break;
          
        case 'vocaria:close':
          // Handle widget close if needed
          break;
      }
    }
  })();