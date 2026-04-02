import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required');
}

async function signIn(page) {
  await page.goto('/');
  // Wait for Angular to boot — either the app or the error overlay
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

async function createProjectAndNavigateTo(page, tab) {
  await page.goto('/');
  const fabButton = page.locator('button#fab mat-icon:has-text("add")');
  await expect(fabButton).toBeVisible();
  await fabButton.click();

  const projectName = `record-test-${Date.now()}`;
  await page.locator('app-new-project-dialog mat-form-field').first().locator('input').fill(projectName);
  await expect(page.locator('app-new-project-dialog mat-select')).not.toHaveAttribute('aria-disabled', 'true');
  await page.locator('app-new-project-dialog mat-select').click();
  await expect(page.locator('mat-option').first()).toBeVisible();
  await page.locator('mat-option').first().click();
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL(/\/[^/]+\/[^/]+\//, { timeout: 15000 });

  const currentUrl = page.url();

  const tabUrl = currentUrl.replace(/\/[^/]+$/, `/${tab}`);
  await page.goto(tabUrl);
  await expect(page).toHaveURL(new RegExp(`/${tab}`));

  return currentUrl;
}

test.describe('Recording', () => {
  test('should record mouse sensor data and save mcap file to project data', async ({ page }) => {
    test.setTimeout(60000);
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`Browser error: ${msg.text()}`);
    });
    page.on('pageerror', err => { throw new Error(`Page JS error: ${err.message}`); });

    await test.step('sign in', () => signIn(page));

    let projectUrl;
    await test.step('create project and navigate to record tab', async () => {
      projectUrl = await createProjectAndNavigateTo(page, 'record');
    });

    await test.step('select Mouse sensor row', async () => {
      const mouseRow = page.locator('mat-row', { hasText: 'Mouse' }).first();
      await expect(mouseRow).toBeVisible();
      await mouseRow.locator('mat-checkbox').click();
    });

    await test.step('start recording', async () => {
      await page.locator('button:has-text("Start Recording")').click();
      await expect(page.locator('button:has-text("Stop Recording")')).toBeVisible();
    });

    await test.step('generate mouse events', async () => {
      for (let i = 0; i < 10; i++) {
        await page.mouse.move(100 + i * 20, 100 + i * 10);
      }
      await expect(page.locator('mat-list-item', { hasText: '/input/mouse' })).toBeVisible();
    });

    await test.step('stop recording', async () => {
      await page.locator('button:has-text("Stop Recording")').click();
      await expect(page.locator('button:has-text("Start Recording")')).toBeVisible();
    });

    await test.step('navigate to data tab and verify .mcap upload', async () => {
      const dataUrl = projectUrl.replace(/\/[^/]+$/, '/data');
      await page.goto(dataUrl);
      await expect(page).toHaveURL(/\/data/);
      await expect(page.locator('mat-row a', { hasText: '.mcap' }).first()).toBeVisible({ timeout: 5000 });
    });
  });
});
