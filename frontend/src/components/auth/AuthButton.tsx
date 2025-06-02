import { Button, ButtonProps } from 'antd';
import { motion } from 'framer-motion';
import React, { forwardRef } from 'react';

export interface AuthButtonProps extends Omit<ButtonProps, 'icon' | 'style'> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

const AuthButton = forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ children, icon, className = '', style, ...props }, ref) => {
    const buttonStyle: React.CSSProperties = {
      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
      overflow: 'hidden',
      position: 'relative' as const,
      ...style,
    };

    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          {...props}
          ref={ref}
          icon={icon}
          className={`w-full h-14 text-base font-medium transition-all duration-300 ${className}`}
          style={buttonStyle}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {children}
          </span>
        </Button>
      </motion.div>
    );
  }
);

AuthButton.displayName = 'AuthButton';

export default AuthButton;
