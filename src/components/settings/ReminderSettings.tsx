import { useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { PermissionExplainer } from './PermissionExplainer';
import {
  requestNotificationPermission,
  showTestNotification,
  type TestNotificationResult,
} from '@/services/notifications';
import { Info, AlertTriangle, Send, CheckCircle2, HelpCircle } from 'lucide-react';
import type { ReminderSettings } from '@/types';

interface ReminderSettingsComponentProps {
  settings: ReminderSettings;
  onUpdate: (partial: Partial<ReminderSettings>) => void;
  permissionState: NotificationPermission | 'unsupported';
  onPermissionRefresh?: () => void;
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
  onPermissionRefresh,
  isPeriodicSyncAvailable: _isPeriodicSyncAvailable,
  canUseReminders,
  limitationMessage,
  activeCityName = 'Selected City',
  activeCityTemp = '20°',
  activeCityCondition = 'Clear',
}: ReminderSettingsComponentProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testFeedback, setTestFeedback] = useState<TestNotificationResult | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

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
    onPermissionRefresh?.();
    if (res === 'granted') {
      onUpdate({ enabled: true });
    }
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setTestFeedback(null);
    try {
      // If permission is default, requesting permission directly from the click handler preserves the user gesture
      if (permissionState === 'default') {
        const res = await requestNotificationPermission();
        onPermissionRefresh?.();
        if (res !== 'granted') {
          setTestFeedback({
            success: false,
            error: 'permission_not_granted',
            message:
              res === 'denied'
                ? 'Notifications were blocked. Please enable them in your browser site settings.'
                : 'Notification prompt was closed. Please allow permissions to test.',
          });
          return;
        }
      }

      const result = await showTestNotification(
        activeCityName,
        activeCityTemp,
        activeCityCondition,
      );
      onPermissionRefresh?.();
      setTestFeedback(result);
      if (result.success) {
        setTimeout(() => setTestFeedback(null), 4000);
      }
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

      {/* Permission: Not granted hint */}
      {permissionState === 'default' && (
        <div className="flex items-center justify-between gap-2 pt-2 text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-primary-500" />
            <p>Notification permission required for daily weather alerts.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowExplainer(true)}
            className="h-6 text-[11px] shrink-0"
          >
            Allow
          </Button>
        </div>
      )}

      {limitationMessage && (
        <div className="flex items-start gap-2 pt-2 text-xs text-[var(--color-text-secondary)]">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-warning-500" />
          <p>{limitationMessage}</p>
        </div>
      )}

      {permissionState === 'denied' && (
        <div className="flex items-start gap-2 pt-2 text-xs text-error-500">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-medium">Notifications are blocked in your browser.</p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">
              Click the site settings/lock icon in your address bar and change Notifications to "Allow", then reload.
            </p>
          </div>
        </div>
      )}

      {/* Settings section when enabled */}
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

          {/* Test Feedback Messages */}
          {testFeedback?.success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 justify-end">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Test notification dispatched! Check your notifications.</span>
            </div>
          )}

          {testFeedback && !testFeedback.success && (
            <div className="rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20 space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Notification could not be displayed</span>
              </div>
              <p className="text-[11px] pl-5 opacity-90">{testFeedback.message}</p>
            </div>
          )}

          {/* Troubleshooting hints toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTroubleshooting((prev) => !prev)}
              className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              <HelpCircle className="h-3 w-3" />
              <span>Notification not appearing? Troubleshooting tips</span>
            </button>

            {showTroubleshooting && (
              <div className="mt-2 rounded-xl bg-[var(--color-surface-secondary)] p-3 text-[11px] text-[var(--color-text-secondary)] space-y-2 border border-[var(--color-border)]">
                <p className="font-semibold text-[var(--color-text-primary)]">Why notifications may not show:</p>
                <ul className="list-disc list-inside space-y-1 text-[var(--color-text-tertiary)]">
                  <li>
                    <strong className="text-[var(--color-text-secondary)]">Windows:</strong> Check that{' '}
                    <em>Focus Assist / Do Not Disturb</em> is off and notifications from your browser are enabled in{' '}
                    <em>Windows Settings → System → Notifications</em>.
                  </li>
                  <li>
                    <strong className="text-[var(--color-text-secondary)]">macOS:</strong> Ensure <em>Focus mode / Do Not Disturb</em> is disabled, and your browser has notification permissions in <em>System Settings → Notifications</em>.
                  </li>
                  <li>
                    <strong className="text-[var(--color-text-secondary)]">Browser settings:</strong> Ensure notifications are set to "Allow" in site permissions (lock icon in address bar).
                  </li>
                  <li>
                    <strong className="text-[var(--color-text-secondary)]">Development mode:</strong> If testing locally, test notifications require an active Service Worker or HTTPS/localhost context.
                  </li>
                </ul>
              </div>
            )}
          </div>
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
