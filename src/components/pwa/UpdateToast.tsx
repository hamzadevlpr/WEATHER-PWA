import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface UpdateToastProps {
  needsUpdate: boolean;
  onUpdate: () => void;
}

export function UpdateToast({ needsUpdate, onUpdate }: UpdateToastProps) {
  return (
    <AnimatePresence>
      {needsUpdate && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 left-4 sm:left-auto z-50 flex max-w-[calc(100vw-2rem)] sm:max-w-md items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <RefreshCw className="h-4 w-4 shrink-0 text-sky-500" />
            <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
              New version available
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onUpdate} className="min-h-11 min-w-11 sm:min-h-7 sm:h-7 text-xs px-3 shrink-0">
            Reload
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
