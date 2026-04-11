import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required');
}

async function signIn(page, email, password) {
  await page.goto('/');
  await Promise.race([
    page.locator('button:has-text("Sign in"), button[mat-icon-button]').first().waitFor({ state: 'visible' }),
    page.locator('vite-error-overlay').waitFor({ state: 'visible' }),
  ]).catch(() => {});
  const overlay = page.locator('vite-error-overlay');
  if (await overlay.isVisible()) {
    throw new Error('Vite error overlay: ' + await overlay.innerText().catch(() => '(unreadable)'));
  }
  if (await page.locator('button:has-text("Sign in")').isVisible()) {
    await page.locator('button:has-text("Sign in")').click();
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
    await page.locator('h2:has-text("Sign In")').waitFor({ state: 'hidden' });
  }
}

function parseColor(raw) {
  const match = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  return { r: +match[1], g: +match[2], b: +match[3], a: match[4] !== undefined ? +match[4] : 1 };
}

test.describe('Sidenav layout', () => {
  test.setTimeout(15000);

  test('desktop: sidenav is side mode with themed backgrounds', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await signIn(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account');

    const sidenav = page.locator('mat-sidenav');
    await expect(sidenav).toBeVisible();
    await expect(sidenav).toHaveClass(/mat-drawer-side/);

    const sidenavBg = await sidenav.evaluate(el => getComputedStyle(el).backgroundColor);
    const sidenavColor = parseColor(sidenavBg);
    expect(sidenavColor, 'sidenav background should be parseable').not.toBeNull();
    expect(sidenavColor.a, 'sidenav background should be opaque').toBeGreaterThan(0.9);

    const container = page.locator('mat-sidenav-container');
    const containerBg = await container.evaluate(el => getComputedStyle(el).backgroundColor);
    const containerColor = parseColor(containerBg);
    expect(containerColor, 'container background should be parseable').not.toBeNull();
    expect(containerColor.a, 'container background should be opaque').toBeGreaterThan(0.9);
  });

  test('mobile: sidenav is over mode with themed backgrounds', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await signIn(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account');

    const sidenav = page.locator('mat-sidenav');
    await expect(sidenav).toBeHidden();

    const menuButton = page.locator('button:has(mat-icon:text("menu"))');
    await menuButton.click();
    await expect(sidenav).toBeVisible();

    await expect(sidenav).toHaveClass(/mat-drawer-over/);

    const sidenavBg = await sidenav.evaluate(el => getComputedStyle(el).backgroundColor);
    const sidenavColor = parseColor(sidenavBg);
    expect(sidenavColor, 'sidenav background should be parseable').not.toBeNull();
    expect(sidenavColor.a, 'sidenav background should be opaque').toBeGreaterThan(0.9);

    const container = page.locator('mat-sidenav-container');
    const containerBg = await container.evaluate(el => getComputedStyle(el).backgroundColor);
    const containerColor = parseColor(containerBg);
    expect(containerColor, 'container background should be parseable').not.toBeNull();
    expect(containerColor.a, 'container background should be opaque').toBeGreaterThan(0.9);
  });
});
