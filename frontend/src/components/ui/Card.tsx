import React from 'react';
import { cn } from '../../utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export function Card({
  children,
  className,
  padding = 'none',
}: CardProps): React.JSX.Element {
  return (
    <div className={cn('card', paddingClasses[padding], className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: CardHeaderProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-start justify-between px-5 py-4 border-b border-border',
        className
      )}
    >
      <div>
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: CardSectionProps): React.JSX.Element {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: CardSectionProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'px-5 py-3 border-t border-border bg-surface rounded-b',
        className
      )}
    >
      {children}
    </div>
  );
}
