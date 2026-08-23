import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', id, onClick }) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-3xl border border-orange-100/90 shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:border-orange-300 active:scale-[0.99]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
