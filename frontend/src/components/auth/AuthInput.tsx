import { Input, InputProps, InputRef } from 'antd';
import { motion } from 'framer-motion';
import React, { forwardRef } from 'react';

export interface AuthInputProps extends Omit<InputProps, 'prefix'> {
  icon?: React.ReactNode;
  label?: string;
}

const AuthInput = forwardRef<InputRef, AuthInputProps>(({ icon, label, className = '', type = 'text', ...props }, ref) => {
  const inputProps = {
    ...props,
    type,
    prefix: icon,
    className: `w-full h-14 px-4 text-base transition-all duration-200 ${className}`,
    style: {
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      ...props.style,
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = '#2563EB';
      e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.15)';
      props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = '#E5E7EB';
      e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
      props.onBlur?.(e);
    },
  };

  const InputComponent = type === 'password' ? Input.Password : Input;

  return (
    <div className="mb-6">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <motion.div whileHover={{ scale: 1.005 }}>
        <InputComponent ref={ref} {...inputProps} />
      </motion.div>
    </div>
  );
});

// Password component for backward compatibility
export interface PasswordProps extends Omit<AuthInputProps, 'type'> {}

const Password = forwardRef<InputRef, PasswordProps>((props, ref) => (
  <AuthInput ref={ref} type="password" {...props} />
));

// Assign Password component to AuthInput.Password
(AuthInput as any).Password = Password;

export { Password as AuthInputPassword };
export default AuthInput;
