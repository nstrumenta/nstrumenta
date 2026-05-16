import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
const TEST_USER_USERNAME = TEST_USER_EMAIL ? TEST_USER_EMAIL.split('@')[0] : '';

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required');
}

async function signIn(page) {
  await page.goto('/');
  await Promise.race([
    page.locator('button:has-text("Sign in"), button[mat-icon-button]').first().waitFor({ state: 'visible' }),
  ]);

  if (await page.locator('button:has-text("Sign in")').isVisible()) {
    await page.locator('button:has-text("Sign in")').click();
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
    await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
    await page.locator('h2:has-text("Sign In")').waitFor({ state: 'hidden' });
  }

  await expect(page.locator('app-navbar-account button[mat-icon-button]')).toBeVisible({ timeout: 15000 });
}

test.describe('Invitations and Notifications UX', () => {
  test('notifications is discoverable from account menu and settings', async ({ page }) => {
    await signIn(page);

    await page.goto('/account');
    await expect(page.locator('mat-toolbar:has-text("User Settings")')).toBeVisible();

    await page.locator('app-navbar-account button[mat-icon-button]').click();
    await expect(page.locator('button[mat-menu-item]:has-text("Notifications")')).toBeVisible();
    await page.locator('button[mat-menu-item]:has-text("Notifications")').click();
    await expect(page).toHaveURL(/\/account\/notifications/);
  });

  test('project settings invite dialog opens with email and role fields', async ({ page }) => {
    await signIn(page);

    await page.goto('/');

    const projectName = `invite-flow-${Date.now()}`;
    const fabButton = page.locator('button#fab mat-icon:has-text("add")');
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    await expect(page.locator('h2:has-text("Add New Project")')).toBeVisible();
    await page.locator('app-new-project-dialog mat-form-field').first().locator('input').fill(projectName);
    await expect(page.locator('app-new-project-dialog mat-select')).not.toHaveAttribute('aria-disabled', 'true');
    await page.locator('app-new-project-dialog mat-select').click();
    await page.locator('mat-option').first().click();
    await page.locator('button:has-text("Create")').click();

    await expect(page).toHaveURL(/\/(overview|data)/);
    await page.locator('a[mat-list-item]:has-text("Settings")').click();
    await expect(page).toHaveURL(/\/settings/);

    await expect(page.locator('button:has-text("Invite Member")')).toBeVisible();
    await page.locator('button:has-text("Invite Member")').click();

    await expect(page.locator('h2:has-text("Invite Project Member")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('mat-select')).toBeVisible();
  });

  test('accept-invite route shows missing parameter guidance', async ({ page }) => {
    await signIn(page);

    await page.goto('/accept-invite?orgId=test-org');
    await expect(page.locator('text=Missing invitation parameters.')).toBeVisible();
  });
});
