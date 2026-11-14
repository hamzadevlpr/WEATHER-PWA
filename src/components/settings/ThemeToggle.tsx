import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import type { ThemeMode } from '@/types';
import { cn } from '@/lib/cn';

export interface ThemeToggleProps {
  theme: ThemeMode;
  onChange: (theme: ThemeMode) => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onChange,
  className,
}) => {
  const options: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className={cn(
        'inline-flex p-1 gap-2 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)]',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = theme === option.value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={isSelected}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-11 min-w-11 sm:min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all outline-none',
              isSelected
                ? 'bg-[var(--color-surface)] text-primary-500 shadow-sm border border-[var(--color-border)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              'focus-visible:ring-2 focus-visible:ring-primary-500/40',
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};
