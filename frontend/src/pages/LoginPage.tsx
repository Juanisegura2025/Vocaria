import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.svg';

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img className="h-16 w-auto" src={logo} alt="Vocaria" />
        </div>
        <Title level={2} className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar sesión
        </Title>
        <Text className="mt-2 text-center text-sm text-gray-600">
          O{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            crea una cuenta
          </Link>
        </Text>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            className="space-y-6"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Por favor ingresa tu correo electrónico' },
                { type: 'email', message: 'Por favor ingresa un correo válido' },
              ]}
            >
              <Input
                prefix={<Mail className="text-gray-400" size={18} />}
                placeholder="Correo electrónico"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Por favor ingresa tu contraseña' },
                { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
              ]}
            >
              <Input.Password
                prefix={<Lock className="text-gray-400" size={18} />}
                type="password"
                placeholder="Contraseña"
                autoComplete="current-password"
              />
            </Form.Item>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Recordarme
                    </label>
                  </div>
                </Form.Item>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                loading={loading}
                icon={<LogIn size={18} className="mr-2" />}
              >
                Iniciar sesión
              </Button>
            </div>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">¿No tienes una cuenta?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/register">
                <Button
                  type="default"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Regístrate ahora
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
