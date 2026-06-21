const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'report-assets', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = 'http://localhost:5173';

async function screenshot(page, name, options = {}) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: options.fullPage ?? false });
  return file;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: EDGE,
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.resource-card', { timeout: 10000 });
  await screenshot(page, 'fig5-1-home-resource-list.png', { fullPage: true });

  await page.goto(`${BASE}/resources/1`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.detail-layout', { timeout: 10000 });
  await screenshot(page, 'fig5-2-resource-detail-comments-rating.png', { fullPage: true });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.auth-form', { timeout: 10000 });
  await screenshot(page, 'fig5-3-login-page.png');

  await page.fill('input[autocomplete="username"]', 'admin');
  await page.fill('input[autocomplete="current-password"]', 'admin123');
  await Promise.all([
    page.waitForURL(`${BASE}/`, { timeout: 10000 }),
    page.click('button[type="submit"]')
  ]);

  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.admin-tabs', { timeout: 10000 });
  await screenshot(page, 'fig5-4-admin-resource-management.png', { fullPage: true });

  await page.getByRole('button', { name: /数据看板/ }).click();
  await page.waitForSelector('.stats-dashboard', { timeout: 10000 });
  await screenshot(page, 'fig5-5-admin-statistics.png', { fullPage: true });

  await page.getByRole('button', { name: /新增素材/ }).click();
  await page.waitForSelector('.admin-form', { timeout: 10000 });
  await screenshot(page, 'fig5-6-admin-resource-form.png', { fullPage: true });

  await browser.close();
  console.log(outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
