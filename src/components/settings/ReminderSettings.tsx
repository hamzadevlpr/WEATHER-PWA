import { useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { PermissionExplainer } from './PermissionExplainer';
import { requestNotificationPermission, showTestNotification } from '@/services/notifications';
import { Info, AlertTriangle, Send } from 'lucide-react';
import type { ReminderSettings } from '@/types';

interface ReminderSettingsComponentProps {
  settings: ReminderSettings;
  onUpdate: (partial: Partial<ReminderSettings>) => void;
  permissionState: NotificationPermission | 'unsupported';
  isPeriodicSyncAvailable: boolean;
  canUseReminders: boolean;
  limitationMessage: string | null;
  activeCityName?: string;
  activeCityTemp?: string;
  activeCityCondition?: string;
}

export function ReminderSettingsComponent({
  settings,
  onUpdate,
  permissionState,
  isPeriodicSyncAvailable: _isPeriodicSyncAvailable,
  canUseReminders,
  limitationMessage,
  activeCityName = 'Selected City',
  activeCityTemp = '20°',
  activeCityCondition = 'Clear',
}: ReminderSettingsComponentProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  const handleToggle = async (enabled: boolean) => {
    if (!enabled) {
      onUpdate({ enabled: false });
      return;
    }

    if (permissionState === 'default') {
      setShowExplainer(true);
      return;
    }

    if (permissionState === 'granted') {
      onUpdate({ enabled: true });
    }
  };

  const handlePermissionGranted = async () => {
    const res = await requestNotificationPermission();
    if (res === 'granted') {
      onUpdate({ enabled: true });
    }
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setTestSuccess(null);
    try {
      const ok = await showTestNotification(activeCityName, activeCityTemp, activeCityCondition);
      setTestSuccess(ok);
      setTimeout(() => setTestSuccess(null), 3000);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label htmlFor="reminder-switch" className="text-sm font-medium text-[var(--color-text-primary)]">
            Daily morning summary
          </label>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Receive morning weather forecast before starting your day
          </p>
        </div>
        <Switch
          id="reminder-switch"
          checked={settings.enabled && canUseReminders}
          disabled={permissionState === 'denied' || permissionState === 'unsupported'}
          onCheckedChange={handleToggle}
        />
      </div>

      {limitationMessage && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{limitationMessage}</p>
        </div>
      )}

      {permissionState === 'denied' && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Notifications are currently blocked. To enable, click the lock or settings icon in your browser URL bar and allow notifications for this site.
          </p>
        </div>
      )}

      {settings.enabled && canUseReminders && (
        <div className="space-y-4 pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <label htmlFor="reminder-time" className="text-xs font-medium text-[var(--color-text-secondary)]">
              Delivery time
            </label>
            <input
              id="reminder-time"
              type="time"
              value={settings.time}
              onChange={(e) => onUpdate({ time: e.target.value })}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text-primary)] focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[var(--color-text-tertiary)]">Preview notification</span>
            <Button
              variant="secondary"
              size="sm"
              loading={testSending}
              onClick={handleSendTest}
              className="text-xs h-8"
            >
              <Send className="mr-1.5 h-3 w-3" />
              Send test notification
            </Button>
          </div>

          {testSuccess === true && (
            <p className="text-xs text-emerald-500 text-right">Test notification delivered!</p>
          )}
          {testSuccess === false && (
            <p className="text-xs text-rose-500 text-right">Could not show notification. Check permissions.</p>
          )}
        </div>
      )}

      <PermissionExplainer
        open={showExplainer}
        onOpenChange={setShowExplainer}
        onAllow={handlePermissionGranted}
      />
    </div>
  );
}
