import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e?: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  className = ''
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    // GeriatricApp Palette - Blue based
    primary: 'bg-primary border-2 border-primary text-white hover:bg-primary-dark hover:border-primary-dark focus:ring-primary font-semibold', // Botón azul
    secondary: 'bg-transparent dark:text-white text-slate-700 hover:bg-primary/10 dark:hover:text-primary focus:ring-primary', // Fondo transparente con hover azul
    outline: 'border-2 border-primary dark:text-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/10 focus:ring-primary', // Outline azul
    danger: 'bg-transparent border-2 border-error text-error hover:bg-error/10 focus:ring-error' // Rojo transparente
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};