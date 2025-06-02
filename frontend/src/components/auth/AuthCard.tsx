import React from 'react';
import { Card } from 'antd';
import { motion, Variants } from 'framer-motion';

export interface AuthCardProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      ease: 'easeOut'
    } 
  },
};

const AuthCard: React.FC<AuthCardProps> = ({ 
  children, 
  icon, 
  title, 
  subtitle, 
  description, 
  className = '',
  style,
  ...cardProps 
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className={`w-full max-w-lg ${className}`}
      style={style}
    >
      <Card
        {...cardProps}
        className="border-0 overflow-hidden transition-all duration-300 hover:shadow-2xl"
        bodyStyle={{ padding: '2.5rem 3rem' }}
        style={{
          borderRadius: '1.25rem',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(229, 231, 235, 0.5)',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="text-center mb-10">
          {icon && (
            <motion.div 
              className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)'
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              {React.cloneElement(icon as React.ReactElement, { 
                size: 24,
                className: 'text-white'
              })}
            </motion.div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-600">
            {subtitle}
          </p>
          {description && (
            <p className="text-sm text-gray-500 mt-2">
              {description}
            </p>
          )}
        </div>

        {children}
      </Card>
    </motion.div>
  );
};

export default AuthCard;
