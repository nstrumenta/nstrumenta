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
  if (await page.locator('button:has-text("Sign in")').isVisible()) {
    await page.locator('button:has-text("Sign in")').click();
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
    await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
    await page.locator('h2:has-text("Sign In")').waitFor({ state: 'hidden' });
  }
}

test.describe('Data Detail', () => {
  test('should upload a JSON file and render its contents in the detail view', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser error: ' + msg.text());
    });

    await signIn(page);

    await page.goto('/');
    await page.locator('button#fab mat-icon:has-text("add")').click();
    const projectName = 'data-detail-test-' + Date.now();
    await page.locator('app-new-project-dialog mat-form-field').first().locator('input').fill(projectName);
    await expect(page.locator('app-new-project-dialog mat-select')).not.toHaveAttribute('aria-disabled', 'true');
    await page.locator('app-new-project-dialog mat-select').click();
    await expect(page.locator('mat-option').first()).toBeVisible();
    await page.locator('mat-option').first().click();
    await page.locator('button:has-text("Create")').click();
    await expect(page).toHaveURL(/\/[^/]+\/[^/]+\/data/);

    const filename = 'test-' + Date.now() + '.json';
    const fileContent = { hello: 'world', value: 42 };
    const fileBuffer = Buffer.from(JSON.stringify(fileContent));

    const uploadDone = page.waitForResponse(
      r => new URL(r.url()).hostname.endsWith('.googleapis.com') && r.request().method() === 'PUT'
    );
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button#fab').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({ name: filename, mimeType: 'application/json', buffer: fileBuffer });

    const uploadResponse = await uploadDone;
    expect(uploadResponse.status(), 'GCS upload should succeed').toBeLessThan(400);

    // File should appear in the data table (waits for storageObjectFinalize → Firestore)
    const fileLink = page.locator('mat-cell a', { hasText: filename });
    await expect(fileLink).toBeVisible({ timeout: 30000 });
    await fileLink.click();
    await expect(page).toHaveURL(/\/data\//);

    // JSON content should be rendered in the detail view
    await expect(page.locator('app-data-detail')).toContainText('"hello"');
    await expect(page.locator('app-data-detail')).toContainText('"world"');

    // Download link should be present with a signed GCS URL
    const downloadLink = page.locator('app-data-detail a[mat-button]');
    await expect(downloadLink).toBeVisible();
    const href = await downloadLink.getAttribute('href');
    expect(href, 'download link should be a signed GCS URL').toMatch(/^https:\/\/storage\.googleapis\.com/);
  });
});
