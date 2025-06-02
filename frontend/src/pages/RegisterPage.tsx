import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Alert, Checkbox } from 'antd';
import { Mail, Lock, User, LogIn, UserPlus, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthCard, AuthButton, AuthInput, TrustIndicators } from '../components/auth';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
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

    setLoading(true);
    try {
      // Use the login function from AuthContext as a temporary solution
      // until the register function is implemented
      await login(values.email, values.password);
      setSuccess('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Error al registrar. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <AuthCard
        icon={<Building2 className="w-8 h-8 text-white" />}
        title="Crea tu cuenta"
        subtitle="Comienza tu viaje con nosotros"
        description="Regístrate para crear y gestionar tus tours virtuales"
      >
        {error && (
          <Alert
            message="Error de registro"
            description={error}
            type="error"
            showIcon
            className="mb-6 rounded-lg"
            closable
            onClose={() => setError('')}
            style={{ border: '1px solid #FEE2E2' }}
          />
        )}
        {success && (
          <Alert
            message="¡Registro exitoso!"
            description={success}
            type="success"
            showIcon
            className="mb-6 rounded-lg"
            style={{ border: '1px solid #D1FAE5' }}
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          className="mt-2"
        >
          <Form.Item
            name="fullName"
            rules={[
              { required: true, message: 'Por favor ingresa tu nombre completo' },
            ]}
            className="mb-6"
          >
            <AuthInput
              placeholder="Nombre completo"
              icon={<User className="text-gray-400" size={20} />}
            />
          </Form.Item>

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
            <AuthInput
              type="password"
              placeholder="Contraseña"
              icon={<Lock className="text-gray-400" size={20} />}
            />
          </Form.Item>

          <Form.Item
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
            className="mb-6"
          >
            <AuthInput
              type="password"
              placeholder="Confirmar contraseña"
              icon={<Lock className="text-gray-400" size={20} />}
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
            <Checkbox className="text-sm text-gray-600">
              Acepto los{' '}
              <a href="/terms" className="text-blue-600 hover:underline">términos y condiciones</a>{' '}
              y{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">política de privacidad</a>
            </Checkbox>
          </Form.Item>

          <Form.Item className="mb-6">
            <AuthButton
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<UserPlus size={18} className="text-white" />}
            >
              Crear cuenta gratuita
            </AuthButton>
          </Form.Item>
        </Form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">¿Ya tienes una cuenta?</span>
          </div>
        </div>

        <Link to="/login">
          <AuthButton
            type="default"
            style={{
              background: 'white',
              color: '#1F2937',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
            icon={<LogIn size={18} className="text-gray-700" />}
          >
            Iniciar sesión
          </AuthButton>
        </Link>

        <TrustIndicators />
      </AuthCard>
    </div>
  );
};

export default RegisterPage;
