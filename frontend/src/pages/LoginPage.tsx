import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Alert, Typography, Card } from 'antd';
import { Mail, Lock, LogIn, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setError('');
      setLoading(true);
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('No se pudo iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg border-0">
        <div className="text-center mb-8">
          {/* Simple logo */}
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.2)'
            }}
          >
            <Home className="w-8 h-8 text-white" />
          </div>
          
          <Title level={2} className="mb-2" style={{ color: '#1F2937', margin: 0 }}>
            Vocaria
          </Title>
          <Text className="text-gray-600">
            Virtual Showing Assistant
          </Text>
        </div>

        {error && (
          <Alert
            message="Error de autenticación"
            description={error}
            type="error"
            showIcon
            className="mb-6"
            closable
            onClose={() => setError('')}
          />
        )}

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="Correo electrónico"
            name="email"
            rules={[
              { required: true, message: 'Ingresa tu correo electrónico' },
              { type: 'email', message: 'Ingresa un correo válido' },
            ]}
          >
            <Input
              prefix={<Mail size={18} style={{ color: '#9CA3AF' }} />}
              placeholder="tu@email.com"
              style={{ height: '48px' }}
            />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="password"
            rules={[
              { required: true, message: 'Ingresa tu contraseña' },
              { min: 6, message: 'Mínimo 6 caracteres' },
            ]}
          >
            <Input.Password
              prefix={<Lock size={18} style={{ color: '#9CA3AF' }} />}
              placeholder="••••••••"
              style={{ height: '48px' }}
            />
          </Form.Item>

          <div className="flex items-center justify-between mb-6">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 rounded border-gray-300"
                  style={{ accentColor: '#2563EB' }}
                />
                Recordar sesión
              </label>
            </Form.Item>
            <Link 
              to="/forgot-password" 
              className="text-sm font-medium"
              style={{ color: '#2563EB' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<LogIn size={18} />}
            style={{
              width: '100%',
              height: '48px',
              fontSize: '16px',
              fontWeight: '500',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
            }}
          >
            Iniciar sesión
          </Button>
        </Form>

        <div className="mt-8 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500">
                ¿Nuevo en Vocaria?
              </span>
            </div>
          </div>
          
          <Link to="/register">
            <Button 
              style={{
                width: '100%',
                height: '48px',
                fontSize: '16px',
                fontWeight: '500',
                borderColor: '#2563EB',
                color: '#2563EB'
              }}
            >
              Crear cuenta gratuita
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex justify-center space-x-6 text-xs text-gray-400">
            <span>🔒 Seguro SSL</span>
            <span>✅ GDPR</span>
            <span>🏢 Real Estate</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
