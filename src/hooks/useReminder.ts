import { useCallback, useMemo } from 'react';
import type { ReminderSettings } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '../services/storage';
import { ReminderSettingsSchema } from '../schemas';
import {
  getNotificationPermission,
  isPeriodicSyncSupported,
} from '../services/notifications';

interface UseReminderReturn {
  settings: ReminderSettings;
  updateSettings: (partial: Partial<ReminderSettings>) => void;
  permissionState: NotificationPermission | 'unsupported';
  isPeriodicSyncAvailable: boolean;
  canUseReminders: boolean;
  limitationMessage: string | null;
}

export function useReminder(): UseReminderReturn {
  const [settings, setSettings] = useLocalStorage<ReminderSettings>(
    STORAGE_KEYS.reminderSettings,
    { enabled: false, time: '07:30', cityId: null },
    ReminderSettingsSchema,
  );

  const updateSettings = useCallback(
    (partial: Partial<ReminderSettings>) => {
      setSettings((prev) => ({ ...prev, ...partial }));
    },
    [setSettings],
  );

  const permissionState = useMemo(() => getNotificationPermission(), []);
  const isPeriodicSyncAvailable = useMemo(() => isPeriodicSyncSupported(), []);

  const canUseReminders = useMemo(
    () => permissionState !== 'unsupported' && permissionState !== 'denied',
    [permissionState],
  );

  const limitationMessage = useMemo(() => {
    if (permissionState === 'unsupported') {
      return 'Your browser does not support notifications. Try Chrome, Edge, or Firefox on desktop.';
    }
    if (permissionState === 'denied') {
      return "Notifications are blocked. You can re-enable them in your browser's site settings (click the lock icon in the address bar).";
    }
    if (!isPeriodicSyncAvailable) {
      return 'Your browser can only remind you while WeatherBoard is open. Install the app for best results.';
    }
    return null;
  }, [permissionState, isPeriodicSyncAvailable]);

  return {
    settings,
    updateSettings,
    permissionState,
    isPeriodicSyncAvailable,
    canUseReminders,
    limitationMessage,
  };
}
