import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface InlineErrorProps {
  message?: string | null;
  id?: string;
  className?: string;
}

function InlineError({ message, id, className }: InlineErrorProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15, ease: 'easeInOut' }}
          className={cn(
            'flex items-center gap-1.5 overflow-hidden text-xs text-error-500',
            className,
          )}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}

InlineError.displayName = 'InlineError';

export { InlineError };
