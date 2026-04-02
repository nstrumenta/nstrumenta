import { test, expect } from '@playwright/test';


const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error(
    'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required'
  )
}

async function signIn(page) {
  await page.goto('/');
  
  if (await page.locator('button:has-text("Sign in")').isVisible()) {
    await page.locator('button:has-text("Sign in")').click();
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
    await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
  }
  
  await expect(page.locator('button[mat-icon-button]').first()).toBeVisible();
}

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`Browser error: ${msg.text()}`);
    });
    page.on('response', async response => {
      if (response.status() >= 400 && response.url().includes('/mcp')) {
        console.log(`MCP request failed: ${response.status()} ${response.url()}`);
      }
    });

    await signIn(page);

    // Always create a fresh project for this test to ensure membership
    await page.goto('/');
    const fabButton = page.locator('button#fab mat-icon:has-text("add")');
    await expect(fabButton).toBeVisible();
    await fabButton.click();

    const projectName = `upload-test-${Date.now()}`;
    await page.locator('app-new-project-dialog mat-form-field').first().locator('input').fill(projectName);

    await expect(page.locator('app-new-project-dialog mat-select')).not.toHaveAttribute("aria-disabled", "true");
    await page.locator('app-new-project-dialog mat-select').click();
    await expect(page.locator('mat-option').first()).toBeVisible();
    await page.locator('mat-option').first().click();

    await page.locator('button:has-text("Create")').click();
    await expect(page).toHaveURL(/\/[^/]+\/[^/]+\//, { timeout: 15000 });

    // Navigate to data tab
    await expect(page).toHaveURL(/\/data/, { timeout: 5000 });
    await expect(page.locator('button#fab')).toBeVisible();
  });

  test('should upload a file via toolbar', async ({ page }) => {
    const filename = `test-upload-${Date.now()}.txt`;
    const fileContent = 'Hello Playwright Upload';
    const fileBuffer = Buffer.from(fileContent);

    // Capture the MCP response to detect errors early
    const mcpResponsePromise = page.waitForResponse(
      response => response.url().includes('/mcp') && response.request().method() === 'POST',
      { timeout: 10000 }
    );

    const uploadResponsePromise = page.waitForResponse(
      response => new URL(response.url()).hostname.endsWith('.googleapis.com') && response.request().method() === 'PUT',
      { timeout: 15000 }
    );

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button#fab').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: filename,
      mimeType: 'text/plain',
      buffer: fileBuffer,
    });

    const mcpResponse = await mcpResponsePromise;
    const mcpBody = await mcpResponse.json();
    const isError = mcpBody.error || mcpBody.result?.isError;
    const errorMsg = mcpBody.error?.message || mcpBody.result?.content?.[0]?.text;
    expect(isError, `MCP get_upload_url failed: ${errorMsg}`).toBeFalsy();
    expect(mcpBody.result?.structuredContent?.uploadUrl, 'uploadUrl missing from MCP response').toBeTruthy();

    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBeLessThan(400);
  });
});
