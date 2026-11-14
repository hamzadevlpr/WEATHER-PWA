import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('audit-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Start vite preview server
console.log('Starting vite preview server...');
const server = spawn('cmd', ['/c', 'npx', 'vite', 'preview', '--port', '4173'], {
  stdio: 'pipe',
});

server.stdout.on('data', (d) => process.stdout.write(d.toString()));
server.stderr.on('data', (d) => process.stderr.write(d.toString()));

// Wait for server to be ready
async function waitForServer(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

async function runAudit() {
  const serverUrl = 'http://localhost:4173';
  await waitForServer(serverUrl);
  console.log('Server is running at', serverUrl);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];

  const checkScrollWidth = async (width, label) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    console.log(`[${label} @ ${width}px] innerWidth: ${innerWidth}, scrollWidth: ${scrollWidth}`);
    if (scrollWidth > innerWidth) {
      const msg = `FAILED: Horizontal scroll detected in ${label} at ${width}px: scrollWidth (${scrollWidth}) > innerWidth (${innerWidth})`;
      console.error(msg);
      errors.push(msg);
    }
  };

  const checkTouchTargets = async (stateLabel) => {
    const violations = await page.evaluate(() => {
      // Select all interactive targets
      const elements = Array.from(
        document.querySelectorAll('button, a, input, [role="option"], [role="button"]')
      );
      const results = [];

      for (const el of elements) {
        // Skip hidden or non-visible elements
        const style = window.getComputedStyle(el);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          style.opacity === '0' ||
          el.offsetParent === null
        ) {
          // Check if it's the skip-link (only active on focus)
          if (el.classList.contains('skip-link')) continue;
          continue;
        }

        const rect = el.getBoundingClientRect();
        // If element is completely offscreen or 0-size, skip
        if (rect.width === 0 || rect.height === 0) continue;

        // Allow tiny subpixel margin (e.g. 43.5px for 44px)
        const minSize = 43.5;
        if (rect.width < minSize || rect.height < minSize) {
          results.push({
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute('role') || el.tagName.toLowerCase(),
            text: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 30),
            className: el.className,
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
          });
        }
      }
      return results;
    });

    if (violations.length > 0) {
      console.error(`[Touch Targets @ 375px - ${stateLabel}] Found ${violations.length} violations:`);
      violations.forEach((v) => {
        console.error(`  - <${v.tag} role="${v.role}"> "${v.text}": ${v.width}x${v.height}px`);
        errors.push(`[Touch Target ${stateLabel}] <${v.tag} role="${v.role}"> "${v.text}": ${v.width}x${v.height}px < 44x44px`);
      });
    } else {
      console.log(`[Touch Targets @ 375px - ${stateLabel}] ALL PASS (>= 44x44px)`);
    }
  };

  try {
    // 1. Basic Breakpoint Audit across widths: 320, 375, 768, 1024, 1280, 1920
    const widths = [320, 375, 768, 1024, 1280, 1920];
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto(serverUrl, { waitUntil: 'networkidle' });
      await checkScrollWidth(w, 'Loaded Weather');
    }

    // 2. Take screenshots at 375, 768, 1280
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_mobile_375.png'), fullPage: true });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_tablet_768.png'), fullPage: true });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_desktop_1280.png'), fullPage: true });

    // 3. Detailed State Audits at 375px mobile
    await page.setViewportSize({ width: 375, height: 812 });

    // State A: Loaded Weather / Default View
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await checkScrollWidth(375, 'State: Loaded Weather');
    await checkTouchTargets('Loaded Weather');

    // State B: Search Dropdown Open
    const searchInput = page.locator('input[role="combobox"]');
    await searchInput.click();
    await searchInput.fill('lon');
    await page.waitForTimeout(600); // wait for debounce and mock/live suggestions
    await checkScrollWidth(375, 'State: Search Dropdown Open');
    await checkTouchTargets('Search Dropdown Open');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_mobile_search_open.png') });

    // State C: Favourites Full (5 favourites)
    await page.evaluate(() => {
      const now = Date.now();
      const mockFavs = [
        { id: 'f1', name: 'Karachi', region: 'Sindh', country: 'Pakistan', latitude: 24.86, longitude: 67.0, addedAt: now },
        { id: 'f2', name: 'Lahore', region: 'Punjab', country: 'Pakistan', latitude: 31.55, longitude: 74.34, addedAt: now },
        { id: 'f3', name: 'Islamabad', region: 'Capital', country: 'Pakistan', latitude: 33.68, longitude: 73.05, addedAt: now },
        { id: 'f4', name: 'Peshawar', region: 'KPK', country: 'Pakistan', latitude: 34.01, longitude: 71.52, addedAt: now },
        { id: 'f5', name: 'Quetta', region: 'Balochistan', country: 'Pakistan', latitude: 30.18, longitude: 66.97, addedAt: now },
      ];
      localStorage.setItem('weatherboard:v1:favourites', JSON.stringify(mockFavs));
    });
    await page.goto(serverUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await checkScrollWidth(375, 'State: Favourites Full');
    await checkTouchTargets('Favourites Full');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_mobile_favourites_full.png') });

    // State D: Settings Dialog Open
    const settingsBtn = page.locator('button[aria-label="Settings"]').first();
    await settingsBtn.click();
    await page.waitForTimeout(400); // wait for modal animation
    await checkScrollWidth(375, 'State: Settings Dialog');
    await checkTouchTargets('Settings Dialog');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_mobile_settings_dialog.png') });

    // Close settings dialog
    const closeDialogBtn = page.locator('button[aria-label="Close dialog"]');
    if (await closeDialogBtn.count() > 0) {
      await closeDialogBtn.click();
      await page.waitForTimeout(300);
    }

    // State E: Offline Banner
    await context.setOffline(true);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await page.waitForTimeout(400);
    await checkScrollWidth(375, 'State: Offline Banner');
    await checkTouchTargets('Offline Banner');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_mobile_offline_banner.png') });

  } finally {
    await browser.close();
    try {
      if (server.pid) {
        spawn('taskkill', ['/pid', server.pid.toString(), '/f', '/t']);
      }
    } catch {
      server.kill();
    }
  }

  console.log('\n--- AUDIT SUMMARY ---');
  if (errors.length > 0) {
    console.error(`FAILED with ${errors.length} issue(s):`);
    errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  } else {
    console.log('ALL RESPONSIVE AUDIT CHECKS PASSED PERFECTLY!');
  }
}

runAudit().catch((err) => {
  console.error(err);
  server.kill();
  process.exit(1);
});
