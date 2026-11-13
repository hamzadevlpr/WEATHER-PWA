import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const variantStyles = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500/40',
  secondary:
    'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-tertiary)] active:bg-[var(--color-border)] focus-visible:ring-[var(--color-border)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-tertiary)] focus-visible:ring-[var(--color-border)]',
  danger:
    'bg-error-500 text-white hover:bg-error-600 active:bg-error-700 focus-visible:ring-error-500/40',
} as const;

const sizeStyles = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg',
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium whitespace-nowrap',
          'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
          'transition-colors duration-150 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'select-none',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <Loader2
            className="h-4 w-4 animate-spin shrink-0"
            aria-hidden="true"
          />
        )}
        {children}
      </Comp>
    );
  },
);

Button.displayName = 'Button';

export { Button };
