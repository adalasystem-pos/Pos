import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  className = '',
  id,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 rounded-2xl';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3.5 text-base font-black min-h-[52px]',
  };

  const variantStyles = {
    primary:
      'bg-orange-500 hover:bg-orange-600 text-white shadow-sm focus:ring-orange-400 border border-orange-500',
    secondary:
      'bg-gray-800 hover:bg-gray-900 text-white shadow-sm focus:ring-gray-700 border border-gray-800',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500 border border-red-600',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500 border border-emerald-600',
    outline:
      'bg-white hover:bg-orange-50/50 text-gray-800 border border-orange-200 focus:ring-orange-300',
    ghost:
      'bg-transparent hover:bg-orange-100/60 text-gray-700 focus:ring-orange-300',
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>جارێک چاوەڕێ بکە...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
