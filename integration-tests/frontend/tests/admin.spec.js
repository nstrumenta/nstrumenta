import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required');
}
if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
  throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
}

async function signInAs(page, email, password) {
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

test.describe('Admin user approval', () => {
  test.setTimeout(10000);

  test('admin menu item is visible after signing in as admin', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser error:', msg.text());
    });

    await signInAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await page.goto('/account');

    await expect(page.locator('mat-toolbar:has-text("User Settings")')).toBeVisible();
    // Open the account menu
    await page.locator('mat-toolbar button:has(mat-icon:text("account_circle"))').click();
    await expect(page.locator('button[mat-menu-item]:has-text("Admin")')).toBeVisible();
  });

  test('admin menu item is not visible for regular user', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser error:', msg.text());
    });

    await signInAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/account');

    await expect(page.locator('mat-toolbar:has-text("User Settings")')).toBeVisible();
    // Open the account menu
    await page.locator('mat-toolbar button:has(mat-icon:text("account_circle"))').click();
    // Admin item should not be rendered for non-admin users
    await expect(page.locator('button[mat-menu-item]:has-text("Admin")')).not.toBeAttached();
  });

  test('admin can navigate to /admin/users and see the pending users table', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser error:', msg.text());
    });

    await signInAs(page, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
    await page.goto('/account');
    // Open account menu and click Admin
    await page.locator('mat-toolbar button:has(mat-icon:text("account_circle"))').click();
    await page.locator('button[mat-menu-item]:has-text("Admin")').click();
    await expect(page.locator('h2:has-text("Pending Users")')).toBeVisible();
  });

  test('non-admin is redirected to home from /admin/users', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser error:', msg.text());
    });

    await signInAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/admin/users');

    await expect(page).toHaveURL('/');
  });
});

