import React from 'react';
import { cn } from '../../utils';
import type { BadgeVariant } from '../../types';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-status-success-bg text-status-success',
  warning: 'bg-status-warning-bg text-status-warning',
  danger:  'bg-status-danger-bg  text-status-danger',
  info:    'bg-status-info-bg    text-status-info',
  neutral: 'bg-surface           text-text-secondary border border-border',
};

const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger:  'bg-status-danger',
  info:    'bg-status-info',
  neutral: 'bg-text-muted',
};

export function Badge({
  variant = 'neutral',
  children,
  dot = false,
  className,
}: BadgeProps): React.JSX.Element {
  return (
    <span className={cn('badge', variantClasses[variant], className)}>
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotClasses[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
