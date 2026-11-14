import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { PermissionExplainer } from '@/components/settings/PermissionExplainer';

describe('Dialog', () => {
  it('does not render content when open is false', () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Enable morning weather reminders</DialogTitle>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText('Enable morning weather reminders')).not.toBeInTheDocument();
  });

  it('renders content when open is true', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Enable morning weather reminders</DialogTitle>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Enable morning weather reminders')).toBeInTheDocument();
  });
});

describe('PermissionExplainer', () => {
  it('is not visible when open is false', () => {
    render(
      <PermissionExplainer
        open={false}
        onOpenChange={vi.fn()}
        onAllow={vi.fn()}
      />
    );

    expect(screen.queryByText('Enable morning weather reminders')).not.toBeInTheDocument();
  });

  it('is visible when open is true and calls onOpenChange(false) when Not now is clicked', () => {
    const handleOpenChange = vi.fn();
    render(
      <PermissionExplainer
        open={true}
        onOpenChange={handleOpenChange}
        onAllow={vi.fn()}
      />
    );

    expect(screen.getByText('Enable morning weather reminders')).toBeInTheDocument();
    expect(screen.getByText('Get a short weather summary each morning at the time you choose.')).toBeInTheDocument();

    const notNowButton = screen.getByRole('button', { name: /not now/i });
    fireEvent.click(notNowButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onAllow and then closes when Enable reminders is clicked', async () => {
    const handleOpenChange = vi.fn();
    const handleAllow = vi.fn().mockResolvedValue(undefined);

    render(
      <PermissionExplainer
        open={true}
        onOpenChange={handleOpenChange}
        onAllow={handleAllow}
      />
    );

    const enableButton = screen.getByRole('button', { name: /enable reminders/i });
    fireEvent.click(enableButton);

    expect(handleAllow).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
