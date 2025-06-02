import React from 'react';
import { CheckCircle, CreditCard, Zap } from 'lucide-react';

interface TrustIndicator {
  icon: React.ReactNode;
  text: string;
  id: string;
}

interface TrustIndicatorsProps {
  className?: string;
}

const TrustIndicators: React.FC<TrustIndicatorsProps> = ({ className = '' }) => {
  const indicators: TrustIndicator[] = [
    { 
      icon: <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />, 
      text: 'Plan gratuito',
      id: 'free-plan'
    },
    { 
      icon: <CreditCard className="w-4 h-4 text-blue-500" aria-hidden="true" />, 
      text: 'Sin tarjeta',
      id: 'no-card'
    },
    { 
      icon: <Zap className="w-4 h-4 text-yellow-500" aria-hidden="true" />, 
      text: 'Setup 5 min',
      id: 'quick-setup'
    },
  ];

  return (
    <div className={`mt-8 pt-6 border-t border-gray-100 ${className}`}>
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
        {indicators.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            {item.icon}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustIndicators;
