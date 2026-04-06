import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

test('Warm up Firestore connection and authenticate', async ({ page }) => {
  console.log('Warming up connection to Firestore...');
  page.on('console', msg => {
    if (msg.text().includes('Could not reach Cloud Firestore')) {
      console.log('Caught expected Firestore cold-start warning during warmup.');
    }
  });

  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();

  const signInButton = page.locator('button:has-text("Sign in")');
  await signInButton.click();
  
  await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
  await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
  await page.locator('button[type="submit"]:has-text("Sign In")').click();
  
  // Wait for login dialog to disappear and the account menu icon to appear
  await expect(page.locator('h2:has-text("Sign In")')).not.toBeVisible({ timeout: 15000 });
  await expect(page.locator('app-navbar-account')).toBeVisible({ timeout: 15000 });

  // Project Grid is on the home page (/)
  await page.goto('/');
  await expect(page.locator('.project-grid')).toBeVisible({ timeout: 15000 });
  await page.waitForLoadState('networkidle');

  await page.context().storageState({ path: '.auth/user.json' });
  console.log('Auth state saved.');
});
