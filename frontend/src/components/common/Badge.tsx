import React from 'react';
import { badgeColor } from '../../utils/formatters';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'teal' | 'amber' | 'red' | 'blue' | 'gray';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, color, className = '' }) => {
  const text = typeof children === 'string' ? children : '';
  const finalColor = color || (text ? badgeColor(text) : 'blue');
  return (
    <span className={`badge ${finalColor} ${className}`.trim()}>
      {children}
    </span>
  );
};
