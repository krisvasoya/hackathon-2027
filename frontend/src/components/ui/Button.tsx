import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';
import type { ButtonVariant, ButtonSize } from '../../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white border-transparent hover:bg-brand-hover active:bg-brand-hover',
  secondary:
    'bg-white text-text-primary border-border hover:bg-surface active:bg-surface',
  ghost:
    'bg-transparent text-text-secondary border-transparent hover:bg-surface hover:text-text-primary',
  danger:
    'bg-status-danger text-white border-transparent hover:bg-red-700 active:bg-red-800',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium border rounded',
        'transition-colors duration-150 focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={14} />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      {children}
      {rightIcon && !isLoading && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
