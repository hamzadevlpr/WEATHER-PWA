# WeatherBoard ⛅

WeatherBoard is a production-grade, installable Progressive Web Application (PWA) weather dashboard designed with high craftsmanship and consumer-grade polish. Built as a single-page, client-side only app, it offers real-time city autocomplete, current meteorological conditions, a 5-day forecast with daily temperature range bars, favourites management, and daily morning weather reminders with offline caching support.

---

## 🌟 Key Features

1. **City Search with Accessible Autocomplete**
   - Full ARIA 1.2 Combobox pattern (`role="combobox"`, keyboard navigation with Arrow Up/Down, Enter, Esc).
   - 300ms pause debouncing and `AbortController` cancellation for responsive querying.
   - Graceful `429` rate-limit detection and actionable inline error presentation.
   - Recent search history saved to local storage with quick-clear functionality.
   - Deep-linking support via URL search query params (`?city=Lahore&lat=31.5497&lon=74.3436`).

2. **Weather Intelligence & Resilient Provider Adapter**
   - **Primary Provider**: OpenWeatherMap (Current weather & 3-hour 5-day forecast aggregated locally).
   - **Zero-Config Fallback Provider**: Open-Meteo. Automatically kicks in on 401, 429, 5xx server issues or missing API keys.
   - **Normalized Internal Type**: Complete provider abstraction (`WeatherBundle`) validated with **Zod**.
   - Zero hardcoded mock weather. Real-time client-side conversion for Celsius ↔ Fahrenheit and m/s ↔ mph without refetching.

3. **Curated Favorites Panel**
   - Save up to 5 favorite cities with instant weather previews.
   - Accessible confirmation dialog with trapped focus to remove items.
   - Automatic fallback to in-memory state if `localStorage` throws or is disabled in private browsing.

4. **Progressive Web App (PWA) & Offline-First**
   - Service worker via Workbox (`injectManifest` strategy in `src/sw.ts`).
   - Network-first caching with 4-second timeout for weather endpoints; stale-while-revalidate for autocomplete and static assets.
   - Offline detection: Unobtrusive persistent offline banner displaying last cached weather update.
   - Native PWA installation via custom install prompt and iOS Safari instructions.
   - 192x192, 512x512, and maskable icons dynamically rendered and verified.

5. **Daily Morning Weather Notifications**
   - Transparent, tiered notification architecture:
     1. **Periodic Background Sync**: For installed PWAs on Chromium engines (`daily-weather` sync registration).
     2. **Foreground/Visibility Trigger**: Checks upon app launch or visibility change if a daily summary hasn't fired yet.
     3. **Documented True Web Push Upgrade Path**: Guide for serverless cron triggers (see below).
   - Custom pre-permission explanation dialog before triggering native browser prompts.

6. **Design & Micro-Interactions**
   - **Tailwind CSS v4** styling with `@theme` custom tokens and high-contrast color ramps.
   - **Animated SVG Weather Icons**: Day/night variations with rotating sun rays, drifting clouds, falling precipitation, and flashing lightning bolts.
   - Full support for `prefers-reduced-motion` and mobile safe-area insets (`env(safe-area-inset-*)`).
   - Instant Dark / Light / System theme toggle without page flash.

---

## 🛠 Tech Stack

| Domain | Technology |
|---|---|
| Build / Bundler | **Vite** + **React 18** + **TypeScript** (Strict Mode) |
| Styling | **Tailwind CSS v4** + `@fontsource-variable/inter` |
| Server State | **TanStack Query v5** (caching, background refetch, retries) |
| Validation | **Zod** (API contracts & localStorage resilience) |
| Motion | **Framer Motion** + CSS Keyframes |
| Icons | **lucide-react** + Handcrafted Animated SVGs |
| PWA & Offline | **vite-plugin-pwa** (`injectManifest`), **Workbox** |
| Accessibility | **Radix UI** primitives (`@radix-ui/react-dialog`, `@radix-ui/react-switch`) |
| Testing | **Vitest** + **@testing-library/react** + **jsdom** |

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` (Tested on `v24`)
- npm `v9+` or `v10+`

### Installation

```bash
# Clone or navigate to the repository root
cd weather-app

# Install dependencies
npm install --legacy-peer-deps

# Create environment configuration
cp .env.example .env.local
```

### Environment Keys

Populate `.env.local` with your free API keys:

```ini
VITE_OWM_API_KEY=your_openweathermap_api_key
VITE_RAPIDAPI_KEY=your_rapidapi_geodb_key
VITE_RAPIDAPI_HOST=wft-geo-db.p.rapidapi.com
```

> **Note on Client-Side Keys:** Because this is a client-side single-page app, keys embedded in the build are visible in network requests. For production environments, we recommend proxying these requests through a Cloudflare Worker, Netlify Function, or Vercel Edge Route to restrict access.
> 
> *If no keys are provided, WeatherBoard automatically activates its Open-Meteo fallback provider, ensuring the weather dashboard continues functioning!*

### Running the App

```bash
# Start local development server
npm run dev

# Run unit and integration tests
npm run test

# Run TypeScript typechecks
npm run typecheck

# Run linter
npm run lint

# Build production bundle with PWA assets
npm run build

# Preview production build locally
npm run preview
```

---

## 📐 Architecture

```
                       +-----------------------------+
                       |      User Interaction       |
                       +--------------+--------------+
                                      |
                       +--------------v--------------+
                       |   React 18 UI / Radix / CSS |
                       +--------------+--------------+
                                      |
                     +----------------v----------------+
                     | TanStack Query & Service Worker |
                     +----------------+----------------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
     +-----------v-----------+                 +-----------v-----------+
     |   OpenWeatherMap      |                 |   Open-Meteo          |
     |   (Primary REST API)  |                 |   (Automatic Fallback)|
     +-----------+-----------+                 +-----------+-----------+
                 |                                         |
                 +--------------------+--------------------+
                                      |
                       +--------------v--------------+
                       | Normalized `WeatherBundle`  |
                       |       (Zod Validated)       |
                       +--------------+--------------+
                                      |
                       +--------------v--------------+
                       | LocalStorage & Offline IDB  |
                       +-----------------------------+
```

---

## 🔔 Push Notifications & Limitations

### Platform Reality
A purely client-side Single Page Application running without a persistent backend server cannot execute arbitrary code or trigger notifications at exact times when the browser tab is fully terminated.

### How WeatherBoard Solves This:
1. **Periodic Background Sync API**: When installed as a standalone PWA on Chromium browsers (Chrome/Edge/Android), WeatherBoard registers a `daily-weather` periodic sync job. The operating system wakes the service worker periodically to fetch conditions and display a notification.
2. **Foreground Catch-Up**: Whenever the user opens or switches tabs to WeatherBoard, the app inspects whether today's reminder has been delivered. If overdue, it displays the weather summary immediately.

### 💡 Optional Backend Upgrade (True Web Push):
To guarantee delivery down to the minute with closed tabs across all platforms (including iOS Safari):
1. Setup a simple cron function (e.g. Cloudflare Workers Cron, GitHub Actions, or AWS Lambda).
2. Generate VAPID keys (`npx web-push generate-vapid-keys`).
3. Store user push subscriptions (`registration.pushManager.subscribe`) in a lightweight key-value database (e.g. Cloudflare KV / Supabase).
4. Have the worker invoke `web-push.sendNotification()` each morning. WeatherBoard's `src/sw.ts` already has the `push` event handler implemented and ready to receive and display such payloads.

---

## 🛠 Decisions and Trade-offs

- **Tailwind CSS v4 & Motion**: Configured with CSS-first `@theme` variables for lightning-fast compilation. Framer Motion was pinned to `v11.18.2` for maximum ecosystem stability with React 18.
- **Provider Fallback Strategy**: OpenWeatherMap delivers rich weather metadata, but free tier keys require manual activation. By pairing it with Open-Meteo, first-time users can clone and test the app immediately without waiting for API key provisioning.
- **Service Worker Precaching**: Using `injectManifest` guarantees full custom control over `periodicsync`, `push`, and `notificationclick` while preserving Workbox precaching benefits.

---

## 📄 License

MIT License. Designed and built with care.
