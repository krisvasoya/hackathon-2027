import React, { forwardRef } from 'react';
import { cn } from '../../utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      required,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {required && (
              <span className="text-status-danger ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-text-muted flex-shrink-0">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={cn(
              'w-full h-9 rounded border bg-white text-sm text-text-primary',
              'placeholder:text-text-muted',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-0 focus:border-brand',
              'disabled:bg-surface disabled:cursor-not-allowed disabled:text-text-secondary',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              error
                ? 'border-status-danger focus:ring-status-danger'
                : 'border-border',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-text-muted flex-shrink-0">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs text-status-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
