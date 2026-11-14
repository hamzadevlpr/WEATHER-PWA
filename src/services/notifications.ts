export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export function isPeriodicSyncSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'periodicSync' in (ServiceWorkerRegistration.prototype)
  );
}

export type TestNotificationResult =
  | { success: true }
  | {
      success: false;
      error:
        | 'permission_not_granted'
        | 'unsupported'
        | 'sw_not_ready'
        | 'notification_failed';
      message: string;
    };

/**
 * Ensures the service worker is registered and returns the active registration.
 */
async function getActiveRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // If a registration already exists or is ready:
    let registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    if (!registration) {
      // Attempt explicit registration if not yet ready
      registration = await navigator.serviceWorker.register('/sw.js', {
        type: 'module',
      });
      // Wait for it to activate
      await navigator.serviceWorker.ready;
    }

    return registration;
  } catch (err) {
    console.warn('[WeatherBoard] Service worker registration lookup failed:', err);
    return null;
  }
}

export async function showTestNotification(
  cityName: string,
  temperature: string,
  condition: string,
): Promise<TestNotificationResult> {
  if (!('Notification' in window)) {
    return {
      success: false,
      error: 'unsupported',
      message: 'This browser does not support notifications.',
    };
  }

  // If permission has not been requested yet (status: default), request it automatically
  if (Notification.permission === 'default') {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          error: 'permission_not_granted',
          message:
            permission === 'denied'
              ? 'Notification permission was denied. Please allow notifications in site settings.'
              : 'Notification permission was dismissed. Please grant permission to test alerts.',
        };
      }
    } catch (permErr) {
      console.warn('[WeatherBoard] requestPermission failed:', permErr);
    }
  }

  if (Notification.permission !== 'granted') {
    return {
      success: false,
      error: 'permission_not_granted',
      message: `Notifications are not allowed (status: ${Notification.permission}). Please allow notifications in site settings.`,
    };
  }

  const title = 'WeatherBoard — Morning Weather';
  const options: NotificationOptions = {
    body: `${cityName || 'Selected City'}: ${temperature || 'Current'}, ${condition || 'Clear'}. Have a great day!`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'weather-test',
    data: { type: 'test' },
  };

  // 1. Primary: Use ServiceWorkerRegistration.showNotification (standard PWA & mobile requirement)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await getActiveRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        console.info('[WeatherBoard] Test notification displayed via Service Worker registration.');
        return { success: true };
      }
    } catch (swErr) {
      console.error('[WeatherBoard] Failed to display notification via Service Worker:', swErr);
    }
  }

  // 2. Secondary fallback: new Notification() (desktop browsers fallback if SW is pending)
  try {
    new Notification(title, options);
    console.info('[WeatherBoard] Test notification displayed via Notification constructor.');
    return { success: true };
  } catch (err) {
    console.error('[WeatherBoard] Notification constructor failed:', err);
    return {
      success: false,
      error: 'notification_failed',
      message:
        err instanceof Error
          ? err.message
          : 'Failed to display notification. Check OS/browser notification permissions.',
    };
  }
}

export async function registerPeriodicSync(minInterval: number): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const reg = registration as ServiceWorkerRegistration & {
      periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> };
    };

    if (!reg.periodicSync) {
      return false;
    }

    await reg.periodicSync.register('daily-weather', { minInterval });
    return true;
  } catch {
    return false;
  }
}
