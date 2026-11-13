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
  return 'serviceWorker' in navigator && 'periodicSync' in (ServiceWorkerRegistration.prototype);
}

export async function showTestNotification(
  cityName: string,
  temperature: string,
  condition: string,
): Promise<boolean> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('WeatherBoard — Morning Weather', {
      body: `${cityName}: ${temperature}, ${condition}. Have a great day!`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'weather-test',
      data: { type: 'test' },
    });
    return true;
  } catch {
    // Fallback to Notification API directly
    try {
      new Notification('WeatherBoard — Morning Weather', {
        body: `${cityName}: ${temperature}, ${condition}. Have a great day!`,
        icon: '/icons/icon-192.png',
      });
      return true;
    } catch {
      return false;
    }
  }
}

export async function registerPeriodicSync(minInterval: number): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    // TypeScript doesn't have periodicSync types built-in
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
