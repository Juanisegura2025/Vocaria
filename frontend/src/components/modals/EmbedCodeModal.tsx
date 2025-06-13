import React, { useState } from 'react';
import { Modal, Button, Input, Space, Typography, message, Alert, Tabs, Card } from 'antd';
import { Code, Copy, CheckCircle, Globe } from 'lucide-react';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface EmbedCodeModalProps {
  visible: boolean;
  onClose: () => void;
  tourId: number;
  tourName: string;
  agentId?: string;
}

const EmbedCodeModal: React.FC<EmbedCodeModalProps> = ({
  visible,
  onClose,
  tourId,
  tourName,
  agentId
}) => {
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState<'basic' | 'advanced'>('basic');

  // Production URL - change this when deploying
  const WIDGET_URL = import.meta.env.PROD
    ? 'https://widget.vocaria.app' 
    : 'http://localhost:3000';

  // Generate embed code
  const basicEmbedCode = `<!-- Vocaria Virtual Assistant -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['VocariaWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','vocaria','${WIDGET_URL}/widget.js'));
  
  vocaria('init', {
    tourId: '${tourId}',
    agentId: '${agentId || 'agent_01jwsmw7pcfp6r4hcebmbbnd43'}',
    position: 'bottom-right',
    primaryColor: '#2563EB',
    greeting: 'Hello! I\\'m your virtual real estate assistant.'
  });
</script>`;

  const advancedEmbedCode = `<!-- Vocaria Virtual Assistant - Advanced Configuration -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['VocariaWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','vocaria','${WIDGET_URL}/widget.js'));
  
  vocaria('init', {
    tourId: '${tourId}',
    agentId: '${agentId || 'agent_01jwsmw7pcfp6r4hcebmbbnd43'}',
    position: 'bottom-right',
    primaryColor: '#2563EB',
    greeting: 'Hello! I\\'m your virtual real estate assistant.',
    language: 'en',
    autoOpen: false,
    mobilePosition: 'bottom-center',
    zIndex: 9999,
    // Callbacks
    onLeadCapture: function(leadData) {
      console.log('Lead captured:', leadData);
      // Your custom lead handling code here
    },
    onReady: function() {
      console.log('Vocaria widget ready');
    },
    onError: function(error) {
      console.error('Vocaria error:', error);
    }
  });
</script>`;

  const matterportIntegrationCode = `<!-- For Matterport Tours -->
<script>
  // Wait for Matterport SDK to be ready
  window.MP_SDK.connect(window.MP_SDK.applicationKey, '${tourId}')
    .then(function(sdk) {
      // Initialize Vocaria with Matterport context
      vocaria('init', {
        tourId: '${tourId}',
        agentId: '${agentId || 'agent_01jwsmw7pcfp6r4hcebmbbnd43'}',
        matterportSDK: sdk
      });
    });
</script>`;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      message.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      message.error('Failed to copy code');
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <Code className="mr-2" size={20} />
          Embed Code for: {tourName}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      <div className="space-y-4">
        <Alert
          message="Widget Installation"
          description="Copy and paste this code into your website's HTML, preferably before the closing </body> tag."
          type="info"
          showIcon
          icon={<Globe size={16} />}
        />

        <Tabs activeKey={embedType} onChange={(key) => setEmbedType(key as 'basic' | 'advanced')}>
          <TabPane tab="Basic Setup" key="basic">
            <div className="space-y-4">
              <Paragraph>
                This is the simplest way to add Vocaria to your website. Just copy and paste this code.
              </Paragraph>
              
              <div className="relative">
                <TextArea
                  value={basicEmbedCode}
                  readOnly
                  rows={12}
                  className="font-mono text-xs"
                />
                <Button
                  type="primary"
                  icon={copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  onClick={() => handleCopy(basicEmbedCode)}
                  className="absolute top-2 right-2"
                >
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </div>
          </TabPane>

          <TabPane tab="Advanced Setup" key="advanced">
            <div className="space-y-4">
              <Paragraph>
                Advanced configuration with callbacks and custom options.
              </Paragraph>
              
              <div className="relative">
                <TextArea
                  value={advancedEmbedCode}
                  readOnly
                  rows={16}
                  className="font-mono text-xs"
                />
                <Button
                  type="primary"
                  icon={copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  onClick={() => handleCopy(advancedEmbedCode)}
                  className="absolute top-2 right-2"
                >
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>

              <Card title="Configuration Options" size="small">
                <div className="space-y-2 text-sm">
                  <div><code>position</code>: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'</div>
                  <div><code>primaryColor</code>: Any valid CSS color</div>
                  <div><code>language</code>: 'en' | 'es' (English or Spanish)</div>
                  <div><code>autoOpen</code>: true | false (auto-open on page load)</div>
                  <div><code>greeting</code>: Custom greeting message</div>
                  <div><code>zIndex</code>: CSS z-index value (default: 9999)</div>
                </div>
              </Card>
            </div>
          </TabPane>

          <TabPane tab="Matterport Integration" key="matterport">
            <div className="space-y-4">
              <Paragraph>
                If you're embedding this widget inside a Matterport tour, use this code to sync room context.
              </Paragraph>
              
              <div className="relative">
                <TextArea
                  value={matterportIntegrationCode}
                  readOnly
                  rows={10}
                  className="font-mono text-xs"
                />
                <Button
                  type="primary"
                  icon={copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  onClick={() => handleCopy(matterportIntegrationCode)}
                  className="absolute top-2 right-2"
                >
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>

              <Alert
                message="Matterport SDK Required"
                description="This integration requires the Matterport SDK to be loaded on your page."
                type="warning"
                showIcon
              />
            </div>
          </TabPane>
        </Tabs>

        <Card title="Need Help?" size="small">
          <Space direction="vertical" className="w-full">
            <Text>
              <strong>Documentation:</strong>{' '}
              <a href="https://docs.vocaria.app/widget" target="_blank" rel="noopener noreferrer">
                docs.vocaria.app/widget
              </a>
            </Text>
            <Text>
              <strong>Support:</strong>{' '}
              <a href="mailto:support@vocaria.app">support@vocaria.app</a>
            </Text>
            <Text>
              <strong>Tour ID:</strong> <code>{tourId}</code>
            </Text>
            <Text>
              <strong>Agent ID:</strong> <code>{agentId || 'agent_01jwsmw7pcfp6r4hcebmbbnd43'}</code>
            </Text>
          </Space>
        </Card>
      </div>
    </Modal>
  );
};

export default EmbedCodeModal;