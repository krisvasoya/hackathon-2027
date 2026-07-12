import React from 'react';
import { getInitials } from '../../utils';
import { cn } from '../../utils';

interface AvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export function Avatar({
  firstName,
  lastName,
  avatarUrl,
  size = 'md',
  className,
}: AvatarProps): React.JSX.Element {
  const initials = getInitials(firstName, lastName);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${firstName} ${lastName}`}
        className={cn(
          'rounded-full object-cover border border-border flex-shrink-0',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      aria-label={`${firstName} ${lastName}`}
      className={cn(
        'rounded-full bg-brand-light text-brand font-semibold',
        'flex items-center justify-center flex-shrink-0 border border-brand/20',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
