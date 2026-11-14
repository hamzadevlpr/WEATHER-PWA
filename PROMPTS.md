# ROLE

You are a senior front-end engineer and product designer. Build **WeatherBoard**, a production-quality, installable weather dashboard PWA, directly in the **root folder of this workspace** (scaffold into the current directory, not a subfolder). It must feel like a polished consumer product, not a tutorial project. Quality over quantity: one feature done well beats five done poorly.

Work in phases (see "Execution Plan"). After each phase, run the build and fix errors before moving on. Do not ask me questions unless you are truly blocked; make sensible decisions and record them in the README.

---

# PRODUCT SUMMARY

WeatherBoard lets users search any city (with live autocomplete), view current conditions and a 5-day forecast, save up to 5 favourite cities, and get a daily morning weather reminder notification. It works offline for the last viewed city.

**Constraints**
- Single-page, **client-side only** (no backend code).
- Public / free-tier REST APIs only.
- Deployed as a PWA (target: Vercel or Netlify; include config).

---

# TECH STACK (use exactly this unless a hard blocker appears)

| Concern | Choice |
|---|---|
| Build tool | **Vite** + **React 18** + **TypeScript** (strict mode) |
| Styling | **Tailwind CSS v4** (CSS-first config with `@theme` tokens; if v4 causes tooling issues, use v3.4 and note it) |
| Server state / fetching | **TanStack Query v5** (caching, retries, loading/error states, `staleTime`) |
| Client state | React Context + hooks (no Redux). Small custom hooks: `useDebounce`, `useLocalStorage`, `useOnlineStatus`, `useTheme`, `useUnits` |
| Validation | **Zod** for API response parsing and input validation (and plain controlled-input validation on blur) |
| Animation | **Framer Motion** for subtle UI motion; CSS keyframes for animated weather icons (no Lottie required) |
| Icons | **lucide-react** for UI icons; custom inline SVG/CSS animated weather icons mapped from condition codes |
| PWA | **vite-plugin-pwa** using the **`injectManifest`** strategy with a custom `src/sw.ts` (needed for `periodicsync`, `push`, `notificationclick`) + **Workbox** modules |
| Accessible primitives | **Radix UI** (`@radix-ui/react-dialog`, `react-switch`, `react-toggle-group`) or Headless UI for dialogs, switches, and the autocomplete listbox semantics |
| Utilities | `clsx`, `tailwind-merge`, `date-fns` (formatting only) |
| Testing | **Vitest** + **React Testing Library** (unit/component); optional Playwright smoke test |
| Quality | ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier (+ tailwind plugin) |
| Deployment | `vercel.json` or `netlify.toml` with SPA fallback and correct headers for `sw.js` (`Cache-Control: no-cache`) and manifest |

---

# APIs

Create `.env.example` (and a git-ignored `.env.local`) with:

```
VITE_OWM_API_KEY=
VITE_RAPIDAPI_KEY=
VITE_RAPIDAPI_HOST=wft-geo-db.p.rapidapi.com
```

Never commit real keys. Document in the README that, because the app is client-side only, these keys are visible in the bundle, and recommend restricting them or proxying in a production setup.

### 1. GeoDB Cities (RapidAPI), city autocomplete
- Endpoint: `GET https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix={q}&limit=6&sort=-population&types=CITY`
- Headers: `X-RapidAPI-Key`, `X-RapidAPI-Host`.
- Free tier is limited to roughly 1 request/second, so **debounce at 300 ms** after the user pauses, cancel stale requests with `AbortController`, and handle `429` gracefully ("Too many searches. Wait a second and try again.").
- Use `latitude`, `longitude`, `name`, `country`, `region` from results; these feed the weather calls (search weather by coordinates, not by name).
- Require at least 2 characters before searching.

### 2. OpenWeatherMap (primary)
- Current: `GET https://api.openweathermap.org/data/2.5/weather?lat=&lon=&units=metric&appid=`
- Forecast: `GET https://api.openweathermap.org/data/2.5/forecast?lat=&lon=&units=metric&appid=` (3-hour steps, 40 entries).
- **Aggregate the 3-hour entries into 5 daily summaries** in the city's local timezone (use the `timezone` offset in the response): min/max temp, most representative condition (prefer midday entry or the most frequent condition), max precipitation probability (`pop`).
- Always request metric and convert °C/°F and m/s ↔ mph **client-side**, so the unit toggle updates instantly without refetching.

### 3. Open-Meteo (fallback, no key)
- `GET https://api.open-meteo.com/v1/forecast?latitude=&longitude=&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`
- Triggered automatically when OpenWeatherMap returns `429`, `401`, `5xx`, or a network failure.
- Implement an **adapter layer** (`src/services/weather/`) that normalizes both providers into one internal `WeatherBundle` type (current + daily[5] + `source: 'openweathermap' | 'open-meteo'` + `fetchedAt` + `timezoneOffset`). Map WMO weather codes to the same internal condition enum as OWM codes. UI must never know which provider answered, except a tiny "Data: Open-Meteo" footnote when the fallback was used.
- Validate every response with Zod. Malformed responses count as failures.

---

# FEATURES AND ACCEPTANCE CRITERIA

## 01. City search with autocomplete
- Accessible **combobox** (ARIA 1.2 pattern: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, listbox/option roles). Keyboard: ↑ ↓ Enter Esc, Home/End.
- Suggestions appear within 300 ms of the user pausing; show a skeleton/spinner inside the dropdown while loading.
- Each suggestion: city, region, country.
- Visible states: **loading**, **no results** ("No cities match 'xyz'. Check the spelling or try a larger nearby city."), **API error** (with a Retry button and a specific cause: rate-limited / network / invalid key).
- Selecting a suggestion loads weather and updates the URL (`?city=Lahore&lat=..&lon=..`) so views are shareable.
- Recent-searches list in the empty dropdown state (store last 5 in localStorage, with "clear" action).

## 02. Weather display
- **Current conditions card:** large temperature, "feels like", condition text + animated icon, humidity, wind speed (with direction if available), local time at the city, high/low for today.
- **5-day forecast:** responsive cards or rows with day name, icon, high/low, precipitation chance. Include a thin temperature-range bar per day (Mercury/Linear-style data viz).
- Every async fetch has a **skeleton loading state** that matches the final layout (no layout shift).
- Errors are specific and actionable: for example "Couldn't reach the weather service. Check your connection; we'll retry automatically" vs "Weather service rate limit hit; showing backup data source." Never show a bare "Something went wrong."
- Show "Updated 4 min ago" with a manual refresh button; refetch on window focus and reconnect (TanStack Query).
- Data must be real. **No mocked or hardcoded weather** outside of tests.

## 03. Form validation
- Search field: validate **on blur and on submit**, not only on submit. Inline messages under the field, linked via `aria-describedby`, `aria-invalid` set.
  - Empty: "Enter a city name to search."
  - Too short / invalid characters: specific message.
  - Submit with text but no selected suggestion: try to resolve the top GeoDB match; if none, "We couldn't find 'xyz'. Try a different spelling or pick a suggestion from the list."
  - Network failure: say what failed and what to do (retry, check connection, or open a favourite, which may be cached).
- Reminder-time input: validate that a valid `HH:mm` is chosen.
- Stripe-style inline validation: calm, no aggressive red flashes; red only for true errors; messages appear with a subtle height/opacity transition.

## 04. Favourite cities
- Save up to **5**; at the limit, the save button is disabled with an explanatory tooltip/message ("You've saved 5 cities. Remove one to add another.").
- Persist in `localStorage` (key namespaced, versioned, e.g. `weatherboard:v1:favourites`). Validate stored JSON with Zod on load; recover from corruption.
- **Quick-access panel**: sidebar on desktop, horizontal scroll chips or bottom sheet on mobile. Each favourite shows a mini current-temp + icon (fetched lazily, cached).
- Removing requires a **confirmation dialog** (accessible, focus-trapped, Esc to close, returns focus). Prefer a Radix Dialog.
- If `localStorage` is unavailable or throws (private mode, quota, blocked), **degrade gracefully**: fall back to in-memory state for the session and show a dismissible notice that favourites won't persist.
- Empty state for no favourites (Linear-style: short explanation + clear call to action).

## 05. PWA
- `manifest.webmanifest`: `name`, `short_name`, `description`, `start_url: "/"`, `scope`, `display: "standalone"`, `theme_color`, `background_color`, `orientation: "any"`, icons **192×192, 512×512, plus a 512×512 maskable**, and an Apple touch icon (180×180). Generate real icon files (a simple, tasteful sun/cloud mark) into `public/icons/`, using a script or an SVG source converted with `sharp` or `pwa-asset-generator`.
- Service worker (`src/sw.ts`, Workbox):
  - Precache the app shell (`precacheAndRoute`), with navigation fallback to `index.html`.
  - **Runtime-cache the last-viewed city's weather**: use a network-first strategy (short timeout, e.g. 4 s) for weather API calls with a cache keyed per request, and ensure the last-viewed city's bundle is also persisted in IndexedDB/localStorage (`weatherboard:v1:lastCity`) so offline start renders it instantly.
  - Do not cache GeoDB autocomplete responses long-term (a short stale-while-revalidate is acceptable).
  - Update flow: when a new service worker is waiting, show a "New version available. Reload" toast (use `registerSW` from `virtual:pwa-register`).
- **Offline mode**: detect with `navigator.onLine` plus `online`/`offline` events (and failed-fetch detection). Show a persistent but unobtrusive **"You're offline. Showing last saved weather for {city}, updated {time}"** banner. Disable search with a clear explanation, while favourites with cached data remain viewable. Remove the banner automatically on reconnect and refetch.
- Provide an optional, non-intrusive "Install app" button using the `beforeinstallprompt` event (hidden when already installed or unsupported; on iOS show a small hint about Share → Add to Home Screen).
- Lighthouse targets: PWA installable, Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.

## 06. Push / daily notifications (be technically honest)

**Platform reality you must handle:** a true Web Push message requires a push server, which this project explicitly does not have. A purely client-side app cannot guarantee a notification at an exact time when the tab is closed. Implement the **best-possible client-only approach with layered fallbacks**, and be transparent in the UI and README:

1. **Primary (installed PWA on Chromium):** Register **Periodic Background Sync** (`registration.periodicSync.register('daily-weather', { minInterval })`) and handle the `periodicsync` event in the service worker. When it fires and the current time is at/after the user's chosen reminder time, and no reminder has been shown today (track `lastNotifiedDate` in IndexedDB), fetch fresh weather for the user's primary city (first favourite or last viewed) and call `registration.showNotification()` with a useful summary ("Lahore: 24°C, partly cloudy. High 27°, 10% rain"). Note the browser controls timing; it requires an installed PWA with sufficient engagement.
2. **Secondary:** if the page is open (or the app was opened that day after the reminder time and none was shown), show the notification via the service worker when due, using an in-page timer/check on `visibilitychange`.
3. **Optional upgrade path (document only, don't build the backend):** a README section describing how to add true Web Push with VAPID keys and a free scheduled worker (e.g. Cloudflare Workers Cron or a GitHub Actions cron) if guaranteed delivery is needed. Structure the code so a `pushsubscriptionchange`/`push` handler already exists in `sw.ts` and shows the payload if one is ever received.

Do **not** use the deprecated Notification Triggers (`showTrigger`) API.

**UX requirements**
- A **Settings / Reminder** panel with: enable switch, time picker (default 07:30), which city to use, and a "Send test notification" button.
- **Pre-permission explainer:** before calling `Notification.requestPermission()`, show a custom dialog explaining *why* ("Get a short weather summary each morning at the time you choose. You can turn this off anytime.") with "Enable reminders" and "Not now" buttons. Only the explicit button triggers the native prompt.
- States: unsupported (clear explanation and what browsers work), `default`, `granted`, `denied` ("Notifications are blocked. You can re-enable them in your browser's site settings"; show brief per-browser hints). **Denied or unsupported must never break anything else.**
- Be honest in the UI when background delivery isn't supported by the browser: "Your browser can only remind you while WeatherBoard is open. Install the app for best results."
- Persist reminder settings in localStorage (with the same graceful degradation).
- `notificationclick` handler: focus an existing client or open the app at the right city.

## 07. Responsive design
- Verified at **375 px, 768 px, 1280 px**. **No horizontal scroll at any breakpoint** (check with a test or script).
- Touch targets **≥ 44×44 px** on mobile (buttons, chips, list options, switches, close icons).
- Mobile: single column, sticky search at top, favourites as horizontal chips or a bottom sheet. Tablet: two-column hybrid. Desktop: sidebar (favourites) + main dashboard grid.
- Respect `prefers-reduced-motion` (disable non-essential animation) and safe-area insets (`env(safe-area-inset-*)`).
- Use `dvh` units, not `vh`, for full-height layouts on mobile.

## Bonus (implement all three; they're in scope)
- **Dark / light / system theme** toggle: detect `prefers-color-scheme`, persist the choice, apply with a class on `<html>`, prevent flash of wrong theme with a tiny inline script in `index.html`, and update `theme-color` meta accordingly.
- **°C / °F unit toggle** persisted in localStorage; updates everywhere instantly (temps, wind speed units m/s↔mph, forecast bars) without refetch.
- **Animated weather icons**: CSS-animated SVG icon set (sun rays rotating slowly, drifting clouds, falling rain/snow, flashing lightning), with day/night variants, disabled under `prefers-reduced-motion`.

---

# UI AND DESIGN DIRECTION

Study (don't copy): **Linear** (layout, empty states, tight type hierarchy), **Vercel Dashboard** (status indicators, subtle motion, information density), **Stripe** (error UX, inline validation), **Mercury** (dashboard cards, calm colour palette, data hierarchy), **Dribbble "weather dashboard"** (card/forecast patterns), **Mobbin** (mobile search, notification, and settings flows).

**Design system (define as Tailwind `@theme` tokens):**
- Calm, confident palette: neutral slate/zinc surfaces, one accent colour (a refined blue or teal), semantic colours for success/warning/error. Both themes designed deliberately, not just inverted.
- Subtle condition-aware accents (e.g. a soft gradient behind the current-conditions card shifting for clear / cloudy / rain / snow / night), kept tasteful and WCAG AA contrast-safe.
- Typography: a modern variable sans (Inter or Geist, self-hosted via `@fontsource-variable/*`, no render-blocking external font CSS). Clear scale; tabular numbers (`tabular-nums`) for temperatures.
- Spacing on a 4px grid, consistent radii (e.g. 12–16 px cards), soft borders over heavy shadows, 1px hairlines.
- Motion: 150–250 ms ease-out transitions, subtle list/card entrance, no gratuitous bouncing.
- Empty states for: first visit (welcome + search prompt + a few suggested cities which only fill the search, not fake weather), no favourites, offline with no cache, notifications denied.
- Fully keyboard navigable, visible focus rings, semantic landmarks (`header`, `main`, `aside`, `nav`), skip link, `aria-live="polite"` region for status/error announcements, WCAG 2.2 AA.

---

# SUGGESTED PROJECT STRUCTURE (in the root folder)

```
/
├─ index.html
├─ package.json, vite.config.ts, tsconfig*.json
├─ vercel.json | netlify.toml
├─ .env.example, .gitignore, .prettierrc, eslint.config.js
├─ README.md
├─ public/
│  ├─ icons/ (192, 512, maskable-512, apple-touch-180, favicon.svg)
│  └─ offline.html (fallback, optional)
└─ src/
   ├─ main.tsx, App.tsx, index.css (Tailwind + tokens)
   ├─ sw.ts                      (Workbox, periodicsync, push, notificationclick)
   ├─ components/
   │  ├─ search/ (CitySearch, SuggestionList, RecentSearches)
   │  ├─ weather/ (CurrentConditions, ForecastList, ForecastDay, WeatherIcon, Skeletons)
   │  ├─ favourites/ (FavouritesPanel, FavouriteChip, ConfirmRemoveDialog)
   │  ├─ settings/ (SettingsDialog, ReminderSettings, PermissionExplainer, ThemeToggle, UnitToggle)
   │  ├─ pwa/ (OfflineBanner, InstallButton, UpdateToast)
   │  └─ ui/ (Button, Dialog, Switch, Toast, Skeleton, InlineError, EmptyState)
   ├─ hooks/ (useDebounce, useLocalStorage, useOnlineStatus, useTheme, useUnits, useCitySearch, useWeather, useFavourites, useReminder, useInstallPrompt)
   ├─ services/
   │  ├─ geodb.ts
   │  ├─ weather/ (openweathermap.ts, openmeteo.ts, normalize.ts, conditions.ts, index.ts with fallback logic)
   │  ├─ storage.ts (safe localStorage wrapper w/ memory fallback)
   │  └─ notifications.ts
   ├─ lib/ (units.ts, dates.ts, errors.ts, cn.ts)
   ├─ schemas/ (zod schemas)
   ├─ types/
   └─ tests/
```

---

# ERROR HANDLING STANDARD

Create a typed `AppError` with `kind`: `network | rate_limited | invalid_key | not_found | validation | storage | unsupported | unknown`, and a central `getUserMessage(error)` returning `{ title, description, action? }`. Every user-facing failure must say **what failed** and **what the user can do**. Include automatic retry with exponential backoff (max 2 retries) for transient errors via TanStack Query, and a manual Retry button.

---

# TESTING

Write focused tests (not exhaustive):
- `aggregateForecast()` correctly produces 5 daily summaries from 40 OWM entries (fixture-based).
- Unit conversions and WMO→internal condition mapping.
- Provider fallback: OWM 429 → Open-Meteo is used.
- Storage wrapper degrades to memory when `localStorage` throws.
- Favourites: max 5 enforced, removal requires confirmation, corrupted JSON recovers.
- Search: debounced, shows loading / no-results / error states.
- Form validation messages on blur.

Add `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run preview`.

---

# EXECUTION PLAN (follow in order; verify each phase)

1. **Scaffold** Vite + React + TS in the current directory, install dependencies, configure Tailwind tokens, ESLint/Prettier, env typing (`vite-env.d.ts`).
2. **Services layer:** GeoDB client, OWM + Open-Meteo adapters, normalization, fallback, Zod schemas, safe storage wrapper, error model. Add unit tests.
3. **Core UI:** layout shell, theme/units, CitySearch combobox, CurrentConditions, ForecastList, skeletons, error states.
4. **Favourites:** panel, limit logic, confirm dialog, storage degradation.
5. **PWA:** manifest, icons, `sw.ts` caching, offline banner, last-city persistence, install button, update toast.
6. **Notifications:** explainer dialog, settings, periodic sync + fallbacks, test notification, notificationclick, denied/unsupported states.
7. **Polish:** animated icons, motion, empty states, accessibility audit, responsive pass at 375/768/1280, reduced-motion.
8. **Verify:** run tests, lint, typecheck, production build, `vite preview`; run Lighthouse if available; manually confirm offline behaviour (DevTools → Offline) and installability. Fix issues.
9. **Docs and deploy config:** write README (setup, getting API keys, env vars, architecture diagram in text, PWA/notification limitations and the optional true-push upgrade path, deployment steps, known trade-offs, screenshots placeholder).

---

# DEFINITION OF DONE

- [ ] `npm run build` succeeds with zero TypeScript and ESLint errors; tests pass.
- [ ] Autocomplete returns suggestions ≤ 300 ms after typing pause (excluding network latency), with loading / empty / error states.
- [ ] Real weather data renders; Open-Meteo fallback verified by simulating an OWM failure.
- [ ] No "Something went wrong" copy anywhere; all errors state cause and next step.
- [ ] Favourites: cap of 5, persistence, confirm-on-remove, graceful no-localStorage mode.
- [ ] Installable (valid manifest, 192/512/maskable icons, SW); last city usable offline; offline banner works.
- [ ] Reminder flow: explainer before native prompt, time picker, test notification, denied/unsupported fallbacks; limitations documented honestly.
- [ ] No horizontal scroll at 375 / 768 / 1280; touch targets ≥ 44 px on mobile.
- [ ] Dark/light/system theme, °C/°F toggle, animated icons all working and persisted.
- [ ] README is complete and a new developer can run the app in under 5 minutes.

Do not leave TODO placeholders, mock data, or commented-out code in the final result. If you must deviate from anything above, explain why in the README under "Decisions and trade-offs."

Warning: Encountered two children with the same key, ``. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.

getting this errro in the console


DESIGN CLEANUP: apply these changes across the whole UI. They override the earlier spec wherever they conflict.

1. Remove all gradients and glows: no gradient backgrounds (including the condition-aware card gradient), no glow or colored box-shadows, no blurred blobs. Use flat solid surfaces from the theme tokens, with 1px borders and at most a very subtle neutral shadow.

2. Replace every emoji with real icons: use lucide-react for UI icons, and the existing SVG weather icon set for conditions. No emoji anywhere in the UI, empty states, toasts or notifications.

3. Delete meaningless badges: remove any badge, pill or tag that doesn't carry real information the user needs. Keep only functional ones (e.g. offline status, "Data: Open-Meteo" when the fallback is used, unit label).

4. Flatten nested cards: no card inside a card. Inside a card, separate sections with spacing or a 1px divider, not another bordered or shaded box.

5. Group related items and tighten spacing: related elements (temperature with feels-like, humidity with wind, a day's high with its low) sit close together. Use larger gaps between unrelated groups, so proximity shows the structure.

6. Match nested corner radii: inner radius = outer radius − padding between them (e.g. a 16px card with 8px padding has 8px inner elements). Define this with radius tokens and apply it consistently to cards, inputs, chips, buttons and dialogs.

7. Limit animation: remove all infinite or looping animations (rotating sun, drifting clouds, pulsing elements). Animate only what matters: loading skeletons while loading, the one-time entrance of results, dialog and toast transitions, and state changes such as the unit toggle. Weather icons should be static, or play once on load. Keep prefers-reduced-motion support.

Run typecheck, lint and build when done, and give me a short list of what changed.



FEATURE: use Lottie animated weather icons for the weather conditions. This replaces the CSS/SVG animated icon set, and overrides the earlier spec where they conflict.

Assets: Lottie files are in [src/assets/lottie/ or /public/lottie/]. I will add them as [.json / .lottie] files. If a file is missing for a condition, use the static SVG fallback described below.

1. Library: install `lottie-react` for .json files, or `@lottiefiles/dotlottie-react` for .lottie files. Use one only.

2. Mapping: create `src/lib/weatherIcons.ts` that maps the internal condition enum (clear, partly-cloudy, cloudy, rain, drizzle, thunderstorm, snow, mist/fog) plus day/night to a Lottie file. Both providers (OpenWeatherMap and Open-Meteo) already normalize to this enum, so the mapping is the only place that changes. Unknown conditions use a generic cloud icon.

3. Component: rework `WeatherIcon` to take `{ condition, isNight, size }`. Keep the same props so no other component changes.
   - Lazy-load the animation data (dynamic import) so the initial bundle stays small. Only load the icon files actually needed.
   - Reserve the icon's width and height so nothing shifts while it loads.
   - Show a static SVG or lucide icon as the fallback while loading and on any load error.

4. Animation rules (these follow the earlier design cleanup, so no endless motion):
   - Play once on first render, then stop on the final frame. No infinite loops.
   - The large current-conditions icon plays once; the 5-day forecast and favourites icons stay static (use a still frame).
   - If `prefers-reduced-motion` is set, never play. Show the still frame only.
   - Pause when the tab is hidden.

5. Offline/PWA: add the Lottie files to the service worker precache so icons work offline. Keep the total icon payload small, and optimise or minify the files if any is over ~50 KB.

6. Accessibility: the icon is decorative when the condition text is shown next to it (`aria-hidden="true"`). Otherwise give it an `aria-label` with the condition name.

7. Cleanup: delete the old CSS keyframe icon code and any unused assets. Add credits and license notes for the animations in the README. Note that some LottieFiles animations require attribution.

8. Tests: a test for the condition → icon mapping, including the day/night variants and the unknown-condition fallback.

Run typecheck, lint, tests and build when done, and list what changed.


TASK: audit and fix responsive design. The app must work correctly at 375px (mobile), 768px (tablet) and 1280px (desktop).

Requirements:
- No horizontal scroll at any width from 320px to 1920px.
- Touch targets are at least 44x44px on mobile (buttons, icon buttons, favourite chips, suggestion options, switches, dialog close buttons, toggles).

Please do the following:
1. Layout per breakpoint:
   - 375px: single column, sticky search at the top, favourites as horizontally scrollable chips (scroll inside their own container, never the page), forecast as a vertical list or a compact grid.
   - 768px: two-column hybrid, with the forecast in a row or grid.
   - 1280px: favourites sidebar plus a main dashboard grid, with a max content width so it doesn't stretch on wide screens.
2. Fix overflow: look for fixed widths, long city names (use truncate or wrap, with min-w-0 on flex children), wide dialogs and dropdowns (max-w-[calc(100vw-2rem)]), and the offline banner and toasts. Use dvh instead of vh, and add safe-area insets for notched phones.
3. Touch targets: set min-h-11 min-w-11 (44px) on all interactive elements on mobile. Small visual icons can keep their size if the clickable area is padded to 44px. Keep at least 8px between adjacent targets.
4. Text and inputs: use 16px minimum font size on inputs (prevents iOS zoom on focus), and no clipped or overlapping text at any width.
5. Verify, don't assume: write a Playwright test (or a script) that loads the app at 375, 768 and 1280 and asserts document.documentElement.scrollWidth <= window.innerWidth. Also check that every button, link, input and [role=option] has a bounding box of at least 44x44 at 375px. Test the main states: home, loaded weather, search dropdown open, favourites full, settings dialog, offline banner.
6. Take a screenshot at each width and check it visually for broken layouts.

Run typecheck, lint, tests and build when done. Then list which problems you found and fixed.