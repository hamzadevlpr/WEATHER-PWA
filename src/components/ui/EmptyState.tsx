import React from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[var(--color-text-secondary)]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';

export { EmptyState };
