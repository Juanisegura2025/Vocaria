import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import logo from '../assets/logo.svg';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirm: string;
  }) => {
    try {
      setError('');
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would register the user here
      console.log('Registering user:', values);
      
      // Redirect to login after successful registration
      navigate('/login?registered=true');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Error al crear la cuenta. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img className="h-16 w-auto" src={logo} alt="Vocaria" />
        </div>
        <Title level={2} className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crear una cuenta
        </Title>
        <Text className="mt-2 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Inicia sesión
          </Link>
        </Text>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Button 
            type="text" 
            icon={<ArrowLeft size={16} />} 
            className="p-0 mb-4 text-blue-600 hover:bg-transparent"
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>
          
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              className="mb-6"
              closable
              onClose={() => setError('')}
            />
          )}
          
          <Form
            name="register"
            onFinish={onFinish}
            className="space-y-6"
            size="large"
            layout="vertical"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="firstName"
                label="Nombre"
                rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
              >
                <Input
                  prefix={<User className="text-gray-400" size={18} />}
                  placeholder="Nombre"
                />
              </Form.Item>
              
              <Form.Item
                name="lastName"
                label="Apellido"
                rules={[{ required: true, message: 'Por favor ingresa tu apellido' }]}
              >
                <Input
                  prefix={<User className="text-gray-400" size={18} />}
                  placeholder="Apellido"
                />
              </Form.Item>
            </div>

            <Form.Item
              name="email"
              label="Correo electrónico"
              rules={[
                { required: true, message: 'Por favor ingresa tu correo electrónico' },
                { type: 'email', message: 'Por favor ingresa un correo válido' },
              ]}
            >
              <Input
                prefix={<Mail className="text-gray-400" size={18} />}
                placeholder="correo@ejemplo.com"
                type="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Contraseña"
              rules={[
                { required: true, message: 'Por favor ingresa una contraseña' },
                { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<Lock className="text-gray-400" size={18} />}
                placeholder="••••••••"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="Confirmar contraseña"
              dependencies={['password']}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: 'Por favor confirma tu contraseña',
                },
                ({ getFieldValue }) => ({
                  validator(_: unknown, value: string) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Las contraseñas no coinciden'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<Lock className="text-gray-400" size={18} />}
                placeholder="••••••••"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                size="large"
                loading={loading}
              >
                Crear cuenta
              </Button>
            </Form.Item>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O regístrate con</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.254-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.16 20 14.416 20 10c0-5.523-4.477-10-10-10z"
                    clipRule="evenodd"
                  />
                </svg>
                GitHub
              </Button>

              <Button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.254-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.933.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.16 20 14.416 20 10c0-5.523-4.477-10-10-10z"
                    clipRule="evenodd"
                  />
                </svg>
                Google
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
