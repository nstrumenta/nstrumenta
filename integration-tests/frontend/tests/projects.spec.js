import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

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

  await page.goto('/');
}

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('should display project list', async ({ page }) => {
    // Look for mat-table which is used for project list
    const projectTable = page.locator('mat-table');
    await expect(projectTable).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    const projectName = `e2e-test-${Date.now()}`;

    page.on('console', msg => { if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text()); });
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    // Intercept /api/orgs to debug response
    page.on('response', async resp => {
      if (resp.url().includes('/api/orgs')) {
        const body = await resp.text().catch(() => '(unreadable)');
        console.log(`/api/orgs → ${resp.status()}: ${body}`);
      }
    });

    const fabButton = page.locator('button#fab mat-icon:has-text("add")');
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    await expect(page.locator('h2:has-text("Add New Project")')).toBeVisible();

    await page.locator('app-new-project-dialog mat-form-field').first().locator('input').fill(projectName);

    // Wait for org dropdown to be enabled (orgs loaded from API)
    await expect(page.locator('app-new-project-dialog mat-select')).not.toHaveAttribute("aria-disabled", "true");

    // Open org dropdown and select first option
    await page.locator('app-new-project-dialog mat-select').click();
    await expect(page.locator('mat-option').first()).toBeVisible();
    await page.locator('mat-option').first().click();

    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton).toBeEnabled();
    await createButton.click();

    await expect(page).toHaveURL(/\/[^/]+\/[^/]+\//);
  });
});
