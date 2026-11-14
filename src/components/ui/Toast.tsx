import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 5000;

const typeConfig: Record<
  ToastType,
  { icon: React.ElementType; containerClass: string }
> = {
  info: {
    icon: Info,
    containerClass: 'border-[var(--color-border)] text-primary-500',
  },
  success: {
    icon: CheckCircle2,
    containerClass: 'border-[var(--color-border)] text-success-500',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-[var(--color-border)] text-warning-500',
  },
  error: {
    icon: XCircle,
    containerClass: 'border-[var(--color-border)] text-error-500',
  },
};

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { icon: Icon, containerClass } = typeConfig[t.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      role="alert"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-sm',
        'bg-[var(--color-surface)] text-[var(--color-text-primary)]',
        containerClass,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm font-medium">{t.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(t.id)}
        className="shrink-0 -mr-2 -mt-2 min-h-11 min-w-11 flex items-center justify-center rounded-md opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => {
        const next = [...prev, { id, type, message }];
        // Keep only the latest MAX_VISIBLE
        return next.slice(-MAX_VISIBLE);
      });

      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 left-4 sm:left-auto z-[100] flex flex-col-reverse gap-2 max-w-[calc(100vw-2rem)] sm:max-w-sm"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

export { ToastProvider, useToast };
export type { ToastType };
