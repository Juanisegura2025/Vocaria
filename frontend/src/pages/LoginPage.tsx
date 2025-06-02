import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Alert, Checkbox } from 'antd';
import { Mail, Lock, LogIn, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthCard, AuthButton, AuthInput, AuthInputPassword, TrustIndicators } from '../components/auth';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await login(values.email, values.password);
      setSuccess('Inicio de sesión exitoso. Redirigiendo...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Login error:', err);
      setError('No se pudo iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 pt-12">
      <AuthCard
        icon={<Home className="text-white" />}
        title="Bienvenido de vuelta"
        subtitle="Inicia sesión en tu cuenta"
        className="w-full max-w-md"
      >
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
        {success && (
          <Alert
            message="¡Éxito!"
            description={success}
            type="success"
            showIcon
            className="mb-6"
          />
        )}
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="mt-2"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Por favor ingresa tu correo electrónico' },
              { type: 'email', message: 'Ingresa un correo electrónico válido' },
            ]}
            className="mb-6"
          >
            <AuthInput
              placeholder="Correo electrónico"
              icon={<Mail className="text-gray-400" size={20} />}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Por favor ingresa tu contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
            ]}
            className="mb-1"
          >
            <AuthInputPassword
              placeholder="Contraseña"
              icon={<Lock className="text-gray-400" size={20} />}
            />
          </Form.Item>

          <div className="flex items-center justify-between mb-8">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Recordarme</Checkbox>
            </Form.Item>
            <Link to="/forgot-password" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Form.Item className="mb-8">
            <AuthButton
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-base font-medium"
            >
              Iniciar sesión <LogIn size={18} className="ml-2" />
            </AuthButton>
          </Form.Item>

          <div className="text-center text-sm text-gray-600 mb-8">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Crear cuenta nueva
            </Link>
          </div>

        </Form>
        <TrustIndicators className="mt-8" />
      </AuthCard>
    </div>
  );
};

export default LoginPage;
