import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('Authentication Flow', () => {
  test('should load the frontend application', async ({ page }) => {
    // Capture console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto(FRONTEND_URL);
    // Wait for Angular app to load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should sign in with test user', async ({ page }) => {
    // Capture console messages
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto(FRONTEND_URL);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Click the "Sign in" button in the navbar
    const signInButton = page.locator('button:has-text("Sign in")');
    await expect(signInButton).toBeVisible({ timeout: 10000 });
    await signInButton.click();
    
    // Wait for login dialog to appear
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible({ timeout: 10000 });
    
    // Fill in email and password in the dialog
    await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
    
    // Click the Sign In submit button in the form
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
    
    // Wait for dialog to close - the dialog should disappear
    await expect(page.locator('h2:has-text("Sign In")')).not.toBeVisible({ timeout: 15000 });
    
    // Wait for successful login - account menu button should appear
    await expect(page.locator('button[mat-icon-button]').first()).toBeVisible({ timeout: 15000 });
  });
});
