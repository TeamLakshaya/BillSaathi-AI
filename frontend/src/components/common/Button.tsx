import React from 'react';
import { Icon } from './Icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  variant?: 'primary' | 'danger' | 'ghost' | 'small' | 'text-link' | string;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  icon,
  variant,
  className = '',
  children,
  ...props
}) => {
  const classes = [variant, className].filter(Boolean).join(' ');

  return (
    <button className={classes || undefined} {...props}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
};
