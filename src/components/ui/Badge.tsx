import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'amber';
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  id,
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  const variantStyles = {
    neutral: 'bg-orange-50 text-gray-700 border border-orange-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-orange-100 text-orange-900 border border-orange-200 font-bold',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    amber: 'bg-orange-500 text-white font-bold shadow-2xs',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center rounded-full whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
