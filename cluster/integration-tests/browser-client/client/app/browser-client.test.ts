import { test, expect } from '@playwright/test';

const apiKey = process.env.NSTRUMENTA_API_KEY;
const wsUrl = process.env.NSTRUMENTA_WS_URL;

test.describe('Page with browser client', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?wsUrl=${wsUrl}&apiKey=${apiKey}`);
  });

  test('loads', async ({ page }) => {
    const text = await page.textContent('body');
    expect(text).toContain('nstrumenta');
  });

  test('connects and gets status', async ({ page }) => {
    await expect(page.locator('#status')).toContainText('_status', { timeout: 10000 });
  });

  test('shows timestamp when button pressed', async ({ page }) => {
    await page.click('#ping-button');
    await expect(page.locator('#ping-result')).toContainText('delta', { timeout: 10000 });
  });
});
