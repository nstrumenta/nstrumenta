import { test, expect } from '@playwright/test';

const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
  throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
}

async function signInAsAdmin(page) {
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
    await page.locator('input[name="email"]').fill(TEST_ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_ADMIN_PASSWORD);
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
    await page.locator('h2:has-text("Sign In")').waitFor({ state: 'hidden' });
  }
}

test.describe('Admin user approval', () => {
  test('admin nav link is visible after signing in as admin', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser error:', msg.text());
    });

    await signInAsAdmin(page);
    await page.waitForLoadState('networkidle');

    // Navigate somewhere that shows the sidenav (account page works without a project)
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('a[mat-list-item]:has-text("Admin")')).toBeVisible({ timeout: 10000 });
  });

  test('admin can navigate to /admin/users and see the pending users table', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser error:', msg.text());
    });

    await signInAsAdmin(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Page should show either the table or the empty state — not a redirect
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(
      page.locator('h2:has-text("Pending Users")')
    ).toBeVisible({ timeout: 10000 });
  });

  test('non-admin is redirected away from /admin/users', async ({ page }) => {
    const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
    const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
    if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
      test.skip();
      return;
    }

    await page.goto('/');
    await Promise.race([
      page.locator('button:has-text("Sign in"), button[mat-icon-button]').first().waitFor({ state: 'visible' }),
      page.locator('vite-error-overlay').waitFor({ state: 'visible' }),
    ]).catch(() => {});
    if (await page.locator('button:has-text("Sign in")').isVisible()) {
      await page.locator('button:has-text("Sign in")').click();
      await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
      await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
      await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
      await page.locator('button[type="submit"]:has-text("Sign In")').click();
      await page.locator('h2:has-text("Sign In")').waitFor({ state: 'hidden' });
    }

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    // Should be redirected to home, not sitting on /admin/users
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });
});
