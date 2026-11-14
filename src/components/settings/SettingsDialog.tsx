import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { ThemeToggle } from './ThemeToggle';
import { UnitToggle } from './UnitToggle';
import { ReminderSettingsComponent } from './ReminderSettings';
import type { ThemeMode, TemperatureUnit, ReminderSettings } from '@/types';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  unit: TemperatureUnit;
  onUnitChange: (unit: TemperatureUnit) => void;
  reminderSettings: ReminderSettings;
  onReminderUpdate: (partial: Partial<ReminderSettings>) => void;
  permissionState: NotificationPermission | 'unsupported';
  onPermissionRefresh?: () => void;
  isPeriodicSyncAvailable: boolean;
  canUseReminders: boolean;
  limitationMessage: string | null;
  activeCityName?: string;
  activeCityTemp?: string;
  activeCityCondition?: string;
}

export function SettingsDialog({
  open,
  onOpenChange,
  theme,
  onThemeChange,
  unit,
  onUnitChange,
  reminderSettings,
  onReminderUpdate,
  permissionState,
  onPermissionRefresh,
  isPeriodicSyncAvailable,
  canUseReminders,
  limitationMessage,
  activeCityName,
  activeCityTemp,
  activeCityCondition,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="pr-10">
          <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight">Preferences</DialogTitle>
          <DialogDescription className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Configure appearance, measurement units, and daily reminders.
          </DialogDescription>
        </div>

        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Theme */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Theme</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Select interface color scheme</p>
            </div>
            <ThemeToggle theme={theme} onChange={onThemeChange} className="w-full sm:w-auto" />
          </div>

          <div className="border-t border-[var(--color-border)]" />

          {/* Unit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Temperature Units</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Convert all temperatures & wind speed</p>
            </div>
            <UnitToggle unit={unit} onChange={onUnitChange} className="w-full sm:w-auto" />
          </div>

          <div className="border-t border-[var(--color-border)]" />

          {/* Notifications */}
          <div>
            <ReminderSettingsComponent
              settings={reminderSettings}
              onUpdate={onReminderUpdate}
              permissionState={permissionState}
              onPermissionRefresh={onPermissionRefresh}
              isPeriodicSyncAvailable={isPeriodicSyncAvailable}
              canUseReminders={canUseReminders}
              limitationMessage={limitationMessage}
              activeCityName={activeCityName}
              activeCityTemp={activeCityTemp}
              activeCityCondition={activeCityCondition}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
          <span>WeatherBoard PWA v1.0.0</span>
          <span>Open-Meteo & OpenWeatherMap</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
