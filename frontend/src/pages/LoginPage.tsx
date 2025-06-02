import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Alert, Checkbox } from 'antd';
import { Mail, Lock, LogIn, UserPlus, Building2 } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <AuthCard
        icon={<Building2 className="text-white" size={32} />}
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

          <div className="flex items-center justify-between mb-6">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="text-sm text-gray-600">Recordarme</Checkbox>
            </Form.Item>
            <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <Form.Item className="mb-6">
            <AuthButton
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<LogIn size={18} className="text-white" />}
            >
              Iniciar sesión
            </AuthButton>
          </Form.Item>
        </Form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">¿No tienes una cuenta?</span>
          </div>
        </div>

        <Link to="/register">
          <AuthButton
            type="default"
            style={{
              background: 'white',
              color: '#1F2937',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
            icon={<UserPlus size={18} className="text-gray-700" />}
          >
            Crear cuenta nueva
          </AuthButton>
        </Link>

        <TrustIndicators />
      </AuthCard>
    </div>
  );
};

export default LoginPage;
