import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface ConfirmRemoveDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  cityName: string;
}

export const ConfirmRemoveDialog: React.FC<ConfirmRemoveDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  cityName,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent showClose={false}>
        <DialogTitle>Remove Favourite</DialogTitle>
        <DialogDescription className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Remove {cityName} from favourites? You can always add it back later.
        </DialogDescription>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} type="button" className="min-h-11 min-w-11 px-4">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} type="button" className="min-h-11 min-w-11 px-4">
            Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
