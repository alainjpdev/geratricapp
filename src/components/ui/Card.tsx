import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`dark:bg-black bg-white border dark:border-white/20 border-gray-200 dark:text-white text-gray-900 rounded-lg shadow-md ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};