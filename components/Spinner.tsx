import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'blue' | 'sky' | 'green';
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'white' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
      white: 'border-white',
      blue: 'border-brand-blue',
      sky: 'border-sky-400',
      green: 'border-green-500',
  }

  return (
    <div
      className={`animate-spin rounded-full border-t-2 border-b-2 ${colorClasses[color]} ${sizeClasses[size]}`}
    ></div>
  );
};