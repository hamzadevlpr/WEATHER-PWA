import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Bell } from 'lucide-react';

interface PermissionExplainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
}

export function PermissionExplainer({ open, onOpenChange, onAllow }: PermissionExplainerProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onAllow();
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]">
            <Bell className="h-4 w-4" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">Enable morning weather reminders</DialogTitle>
            <DialogDescription className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Get a short weather summary each morning at the time you choose.
            </DialogDescription>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] space-y-1.5">
          <p>• Daily summary of temperature and expected conditions</p>
          <p>• Pick your preferred time (default 07:30 AM)</p>
          <p>• Completely client-side and privacy friendly</p>
          <p>• You can turn this off at any time</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="min-h-11 min-w-11 px-4">
            Not now
          </Button>
          <Button variant="primary" size="sm" loading={loading} onClick={handleConfirm} className="min-h-11 min-w-11 px-4">
            Enable reminders
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
