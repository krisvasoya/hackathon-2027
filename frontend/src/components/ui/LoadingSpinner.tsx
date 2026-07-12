import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 36,
};

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center text-brand', className)}
    >
      <Loader2 size={sizeMap[size]} className="animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

// ─── Full Page Loading Screen ─────────────────────────────────────────────────

export function PageLoader(): React.JSX.Element {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-surface z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="text-lg font-semibold text-text-primary">TransitOps</span>
        </div>
        <LoadingSpinner size="md" />
        <p className="text-sm text-text-secondary">Loading your workspace...</p>
      </div>
    </div>
  );
}
