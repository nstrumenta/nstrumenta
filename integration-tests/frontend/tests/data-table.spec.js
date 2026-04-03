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

test.describe('Data Table', () => {
  test('should upload a file and download it via signed URL from the actions menu', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('Browser error: ' + msg.text());
    });

    await signIn(page);

    await page.goto('/');
    await page.locator('button#fab mat-icon:has-text("add")').click();
    const projectName = 'data-table-test-' + Date.now();
    await page.locator('app-new-project-dialog mat-form-field').first().locator('input').fill(projectName);
    await expect(page.locator('app-new-project-dialog mat-select')).not.toHaveAttribute('aria-disabled', 'true');
    await page.locator('app-new-project-dialog mat-select').click();
    await expect(page.locator('mat-option').first()).toBeVisible();
    await page.locator('mat-option').first().click();
    await page.locator('button:has-text("Create")').click();
    await expect(page).toHaveURL(/\/[^/]+\/[^/]+\/data/);

    const filename = 'test-' + Date.now() + '.txt';
    const fileBuffer = Buffer.from('hello from playwright');

    const uploadDone = page.waitForResponse(
      r => new URL(r.url()).hostname.endsWith('.googleapis.com') && r.request().method() === 'PUT'
    );
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button#fab').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({ name: filename, mimeType: 'text/plain', buffer: fileBuffer });

    const uploadResponse = await uploadDone;
    expect(uploadResponse.status(), 'GCS upload should succeed').toBeLessThan(400);

    // File should appear in the data table (waits for storageObjectFinalize → Firestore)
    const fileRow = page.locator('mat-row', { hasText: filename });
    await expect(fileRow).toBeVisible({ timeout: 15000 });

    // Click the kebab menu → Download; intercept the MCP response to get the signed URL
    const mcpResponsePromise = page.waitForResponse(
      r => r.url().includes('/mcp') && r.request().method() === 'POST'
    );
    await fileRow.locator('button[mat-icon-button]').click();
    await page.locator('button[mat-menu-item]:has-text("Download")').click();

    const mcpResponse = await mcpResponsePromise;
    const mcpBody = await mcpResponse.json().catch(() => null);
    const signedUrl = mcpBody && mcpBody.result && mcpBody.result.structuredContent && mcpBody.result.structuredContent.downloadUrl;
    expect(signedUrl, 'MCP get_download_url should return a signed GCS URL').toMatch(/^https:\/\/storage\.googleapis\.com/);

    // The signed URL should return 200 — verifies the service account has storage.objects.get
    const status = await page.evaluate(
      url => fetch(url, { credentials: 'omit' }).then(r => r.status),
      signedUrl
    );
    expect(status, 'signed URL should return 200, not 403').toBe(200);
  });
});
