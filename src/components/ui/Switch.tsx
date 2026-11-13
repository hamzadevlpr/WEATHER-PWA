import React, { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/cn';

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
}

const Switch = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, label, id, ...props }, ref) => {
  const switchId = id ?? (label ? `switch-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  const switchElement = (
    <SwitchPrimitive.Root
      ref={ref}
      id={switchId}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
        'border-2 border-transparent transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary-500',
        'data-[state=unchecked]:bg-[var(--color-border)]',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm',
          'ring-0 transition-transform duration-200',
          'data-[state=checked]:translate-x-5',
          'data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (!label) return switchElement;

  return (
    <div className="flex items-center gap-3">
      {switchElement}
      <label
        htmlFor={switchId}
        className="cursor-pointer select-none text-sm font-medium text-[var(--color-text-primary)]"
      >
        {label}
      </label>
    </div>
  );
});

Switch.displayName = 'Switch';

export { Switch };
