import React from 'react';
import { cn } from '@/lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

function Skeleton({ className, width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-[var(--color-surface-secondary)]',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-[var(--color-surface-tertiary)] before:to-transparent',
        'before:animate-[shimmer_2s_ease-in-out_infinite]',
        'before:-translate-x-full',
        className,
      )}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

Skeleton.displayName = 'Skeleton';

export { Skeleton };
