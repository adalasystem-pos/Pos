import React from 'react';
import { Card } from '../ui/Card';

interface SummaryCardProps {
  title: string;
  amount: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'sales' | 'expenses' | 'profit' | 'neutral';
  id?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  subtitle,
  icon,
  variant = 'neutral',
  id,
}) => {
  const variantStyles = {
    sales: 'bg-white border-2 border-orange-100 text-gray-900',
    expenses: 'bg-white border-2 border-red-100 text-gray-900',
    profit: 'bg-orange-500 border-2 border-orange-600 text-white shadow-md',
    neutral: 'bg-white border-2 border-orange-100 text-gray-900',
  };

  const iconBgStyles = {
    sales: 'bg-orange-100 text-orange-600',
    expenses: 'bg-red-100 text-red-600',
    profit: 'bg-white text-orange-600 shadow-2xs',
    neutral: 'bg-orange-50 text-gray-700',
  };

  const amountColorStyles = {
    sales: 'text-orange-600 font-black',
    expenses: 'text-red-600 font-black',
    profit: 'text-white font-black',
    neutral: 'text-gray-900 font-black',
  };

  const titleColorStyles = {
    sales: 'text-gray-500',
    expenses: 'text-gray-500',
    profit: 'text-orange-100',
    neutral: 'text-gray-500',
  };

  return (
    <Card
      id={id}
      className={`p-5 sm:p-6 border transition-all text-right shadow-sm rounded-3xl ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className={`p-3 rounded-2xl ${iconBgStyles[variant]}`}>{icon}</div>
        <span className={`text-xs font-bold ${titleColorStyles[variant]}`}>{title}</span>
      </div>

      <div className="space-y-1">
        <h3 className={`text-2xl sm:text-3xl tracking-tight ${amountColorStyles[variant]}`}>
          {amount}
        </h3>
        {subtitle && (
          <p className={`text-xs font-semibold ${variant === 'profit' ? 'text-orange-100' : 'text-gray-400'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
};
