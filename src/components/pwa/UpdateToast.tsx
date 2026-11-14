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
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-sky-500" />
            <p className="text-xs font-medium text-[var(--color-text-primary)]">
              New version available
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={onUpdate} className="h-7 text-xs px-2.5">
            Reload
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
