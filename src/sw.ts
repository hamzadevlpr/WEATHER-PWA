import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Precache the app shell
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Navigation fallback to index.html
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 4,
  }),
);

// Cache weather API responses — network-first with 4s timeout
registerRoute(
  ({ url }) =>
    url.hostname === 'api.openweathermap.org' ||
    url.hostname === 'api.open-meteo.com',
  new NetworkFirst({
    cacheName: 'weather-api',
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  }),
);

// Cache GeoDB autocomplete — stale-while-revalidate, short TTL
registerRoute(
  ({ url }) => url.hostname === 'wft-geo-db.p.rapidapi.com',
  new StaleWhileRevalidate({
    cacheName: 'geodb-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  }),
);

// Cache fonts
registerRoute(
  ({ request }) => request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  }),
);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  }),
);

// Periodic Background Sync for daily weather reminders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'daily-weather') {
    event.waitUntil(handleDailyWeatherSync());
  }
});

async function handleDailyWeatherSync(): Promise<void> {
  try {
    // Check if we should send a notification today
    const lastNotifiedStr = await getFromIDB('lastNotifiedDate');
    const today = new Date().toISOString().split('T')[0] ?? '';
    if (!today || lastNotifiedStr === today) return;

    // Get reminder settings from IDB/localStorage
    const settingsStr = await getFromIDB('reminderSettings');
    if (!settingsStr) return;

    const settings = JSON.parse(settingsStr) as { enabled: boolean; time: string; cityId: string | null };
    if (!settings.enabled) return;

    // Check if current time is at or after reminder time
    const now = new Date();
    const [hours, minutes] = settings.time.split(':').map(Number);
    if (hours === undefined || minutes === undefined) return;
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    if (now < reminderTime) return;

    // Get last city from storage
    const cityStr = await getFromIDB('lastCity');
    if (!cityStr) return;

    const city = JSON.parse(cityStr) as { name: string; latitude: number; longitude: number };

    // Fetch fresh weather
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code&timezone=auto`,
    );

    if (!response.ok) return;

    const data = (await response.json()) as {
      current: { temperature_2m: number; weather_code: number };
    };

    const temp = Math.round(data.current.temperature_2m);
    const condition = getWeatherDescription(data.current.weather_code);

    await self.registration.showNotification('WeatherBoard — Morning Weather', {
      body: `${city.name}: ${temp}°C, ${condition}. Have a great day!`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'daily-weather',
      data: { cityName: city.name, type: 'daily-weather' },
    });

    await saveToIDB('lastNotifiedDate', today);
  } catch {
    // Silently fail — we'll try again next time
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data as { cityName?: string; type?: string } | undefined;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      const url = data?.cityName ? `/?city=${encodeURIComponent(data.cityName)}` : '/';
      return self.clients.openWindow(url);
    }),
  );
});

// Push handler (for future upgrade path with VAPID)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json() as { title?: string; body?: string; cityName?: string };
    event.waitUntil(
      self.registration.showNotification(payload.title ?? 'WeatherBoard', {
        body: payload.body ?? 'Check your weather update',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'push-weather',
        data: { cityName: payload.cityName, type: 'push' },
      }),
    );
  } catch {
    // Invalid payload
  }
});

// Simple IDB helpers for the service worker
function getIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('weatherboard-sw', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('kv');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFromIDB(key: string): Promise<string | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction('kv', 'readonly');
      const store = tx.objectStore('kv');
      const request = store.get(key);
      request.onsuccess = () => resolve((request.result as string) ?? null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToIDB(key: string, value: string): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction('kv', 'readwrite');
      const store = tx.objectStore('kv');
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Silently fail
  }
}

function getWeatherDescription(code: number): string {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly cloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'foggy';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rain showers';
  if (code >= 85 && code <= 86) return 'snow showers';
  if (code >= 95) return 'thunderstorm';
  return 'varied';
}
