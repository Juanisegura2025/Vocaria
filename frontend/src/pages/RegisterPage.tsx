import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Alert, Checkbox } from 'antd';
import { Mail, Lock, User, UserPlus, Building2 } from 'lucide-react';
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
      form.setFields([{ name: 'confirmPassword', errors: ['Passwords do not match'] }]);
      return;
    }

    setLoading(true);
    try {
      // Use the login function from AuthContext as a temporary solution
      // until the register function is implemented
      await login(values.email, values.password);
      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 pt-12">
      <AuthCard
        icon={<Building2 className="text-white" />}
        title="Create your account"
        subtitle="Start your journey with us"
        description="Sign up to create and manage your virtual tours"
        className="w-full max-w-md"
      >
        {error && (
          <Alert
            message="Registration error"
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
            message="Registration successful!"
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
              { required: true, message: 'Please enter your full name' },
            ]}
            className="mb-6"
          >
            <AuthInput
              placeholder="Full name"
              icon={<User className="text-gray-400" size={20} />}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email address' },
              { type: 'email', message: 'Please enter a valid email address' },
            ]}
            className="mb-6"
          >
            <AuthInput
              placeholder="Email address"
              icon={<Mail className="text-gray-400" size={20} />}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
            className="mb-1"
          >
            <AuthInput
              type="password"
              placeholder="Password"
              icon={<Lock className="text-gray-400" size={20} />}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
            className="mb-6"
          >
            <AuthInput
              type="password"
              placeholder="Confirm password"
              icon={<Lock className="text-gray-400" size={20} />}
            />
          </Form.Item>

          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('You must accept the terms and conditions')),
              },
            ]}
            className="mb-6"
          >
            <Checkbox className="text-sm text-gray-600">
              I accept the{' '}
              <a href="/terms" className="text-blue-600 hover:underline">terms and conditions</a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">privacy policy</a>
            </Checkbox>
          </Form.Item>

          <Form.Item className="mb-8">
            <AuthButton
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-base font-medium"
            >
              Create account <UserPlus size={18} className="ml-2" />
            </AuthButton>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-600 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </div>
        
        <TrustIndicators className="mt-8" />
      </AuthCard>
    </div>
  );
};

export default RegisterPage;