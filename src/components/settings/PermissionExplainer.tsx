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
      <DialogContent className="max-w-md p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold">Enable morning weather reminders</DialogTitle>
            <DialogDescription className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Get a short weather summary each morning at the time you choose.
            </DialogDescription>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[var(--color-surface-secondary)] p-3 text-xs text-[var(--color-text-secondary)] space-y-1.5 border border-[var(--color-border)]">
          <p>• Daily summary of temperature and expected conditions</p>
          <p>• Pick your preferred time (default 07:30 AM)</p>
          <p>• Completely client-side and privacy friendly</p>
          <p>• You can turn this off at any time</p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button variant="primary" size="sm" loading={loading} onClick={handleConfirm}>
            Enable reminders
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
