import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Alert, Typography, Card, Checkbox } from 'antd';
import { User, Mail, Lock, LogIn, Building2, UserPlus } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';  // Uncomment when register is implemented

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // TODO: Uncomment when register function is available in AuthContext
  // const { register } = useAuth();
  const register = async (email: string, _password: string, fullName: string) => {
    // Temporary implementation until AuthContext is updated
    console.log('Registering:', { email, fullName });
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: { 
    fullName: string; 
    email: string; 
    password: string; 
    confirmPassword: string;
    terms: boolean;
  }) => {
    if (values.password !== values.confirmPassword) {
      form.setFields([{ name: 'confirmPassword', errors: ['Las contraseñas no coinciden'] }]);
      return;
    }

    try {
      setError('');
      setLoading(true);
      await register(values.email, values.password, values.fullName);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError('No se pudo crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card 
        className="w-full max-w-md shadow-lg border-0"
        bodyStyle={{ padding: '40px' }}
      >
        <div className="text-center mb-8">
          {/* Simple logo */}
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.2)'
            }}
          >
            <Building2 className="w-8 h-8 text-white" />
          </div>
          
          <Title level={2} className="mb-2" style={{ color: '#1F2937', margin: 0 }}>
            Únete a Vocaria
          </Title>
          <Text className="text-gray-600">
            Crea tu cuenta gratuita
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Comienza a capturar leads en tus tours 3D
          </Text>
        </div>

        {error && (
          <Alert
            message="Error de registro"
            description={error}
            type="error"
            showIcon
            className="mb-6"
            closable
            onClose={() => setError('')}
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="Nombre completo"
            name="fullName"
            rules={[
              { required: true, message: 'Por favor ingresa tu nombre completo' },
              { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
            ]}
          >
            <Input
              prefix={<User size={18} style={{ color: '#9CA3AF' }} />}
              placeholder="Juan Pérez"
              style={{ height: '48px' }}
            />
          </Form.Item>

          <Form.Item
            label="Correo electrónico"
            name="email"
            rules={[
              { required: true, message: 'Por favor ingresa tu correo' },
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
              { required: true, message: 'Por favor ingresa tu contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
            ]}
          >
            <Input.Password
              prefix={<Lock size={18} style={{ color: '#9CA3AF' }} />}
              placeholder="••••••••"
              style={{ height: '48px' }}
            />
          </Form.Item>

          <Form.Item
            label="Confirmar contraseña"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Por favor confirma tu contraseña' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<Lock size={18} style={{ color: '#9CA3AF' }} />}
              placeholder="••••••••"
              style={{ height: '48px' }}
            />
          </Form.Item>

          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('Debes aceptar los términos y condiciones')),
              },
            ]}
            className="mb-6"
          >
            <Checkbox style={{ fontSize: '14px' }}>
              Acepto los{' '}
              <a href="/terms" className="text-blue-600 hover:underline">términos y condiciones</a>{' '}
              y{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">política de privacidad</a>
            </Checkbox>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<UserPlus size={18} />}
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
            Crear cuenta gratuita
          </Button>
        </Form>

        <div className="mt-8 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-sm text-gray-500">
                ¿Ya tienes cuenta?
              </span>
            </div>
          </div>
          
          <Link to="/login">
            <Button 
              style={{
                width: '100%',
                height: '48px',
                fontSize: '16px',
                fontWeight: '500',
                borderColor: '#2563EB',
                color: '#2563EB'
              }}
              icon={<LogIn size={18} />}
            >
              Iniciar sesión
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex justify-center space-x-6 text-xs text-gray-400">
            <span>✨ Plan gratuito</span>
            <span>💳 Sin tarjeta</span>
            <span>⚡ Setup 5 min</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
