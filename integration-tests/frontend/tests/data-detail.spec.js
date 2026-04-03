import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required');
}

async function signIn(page) {
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
    await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
  }
  await expect(page.locator('button[mat-icon-button]').first()).toBeVisible();
}

test.describe('Data Detail', () => {
  test('should upload a JSON file and view its contents in data detail', async ({ page }) => {
    test.setTimeout(60000);
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`Browser error: ${msg.text()}`);
    });
    page.on('pageerror', err => { throw new Error(`Page JS error: ${err.message}`); });

    await signIn(page);

    // Create a fresh project
    await page.goto('/');
    await page.locator('button#fab mat-icon:has-text("add")').click();
    const projectName = `data-detail-test-${Date.now()}`;
    await page.locator('app-new-project-dialog mat-form-field').first().locator('input').fill(projectName);
    await expect(page.locator('app-new-project-dialog mat-select')).not.toHaveAttribute('aria-disabled', 'true');
    await page.locator('app-new-project-dialog mat-select').click();
    await expect(page.locator('mat-option').first()).toBeVisible();
    await page.locator('mat-option').first().click();
    await page.locator('button:has-text("Create")').click();
    await expect(page).toHaveURL(/\/[^/]+\/[^/]+\/data/, { timeout: 15000 });

    // Upload a JSON file
    const filename = `test-${Date.now()}.json`;
    const fileContent = { hello: 'world', value: 42 };
    const fileBuffer = Buffer.from(JSON.stringify(fileContent));

    const uploadResponsePromise = page.waitForResponse(
      response => new URL(response.url()).hostname.endsWith('.googleapis.com') && response.request().method() === 'PUT',
      { timeout: 15000 }
    );

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button#fab').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({ name: filename, mimeType: 'application/json', buffer: fileBuffer });

    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBeLessThan(400);

    // Wait for the file to appear in the data table
    const fileLink = page.locator('mat-cell a', { hasText: filename });
    await expect(fileLink).toBeVisible({ timeout: 15000 });

    // Click the file link to open data-detail view
    await fileLink.click();
    await expect(page).toHaveURL(/\/data\//, { timeout: 5000 });

    // The JSON content should be rendered
    await expect(page.locator('app-data-detail div', { hasText: '"hello"' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('app-data-detail div', { hasText: '"world"' })).toBeVisible();

    // The download link should be present and non-empty
    await expect(page.locator('app-data-detail a[mat-button]')).toHaveAttribute('href', /^blob:|^https:/, { timeout: 10000 });
  });
});
