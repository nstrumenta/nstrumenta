import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

async function signIn(page) {
  await page.goto(FRONTEND_URL);
  
  // Click the "Sign in" button in the navbar
  await page.locator('button:has-text("Sign in")').click();
  
  // Wait for login dialog to appear
  await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
  
  // Fill in email and password
  await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
  await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
  
  // Submit
  await page.locator('button[type="submit"]:has-text("Sign In")').click();
  
  // Wait for successful login - account menu button should appear
  await expect(page.locator('button[mat-icon-button]').first()).toBeVisible({ timeout: 10000 });
  
  // Navigate to projects page
  await page.goto(`${FRONTEND_URL}/projects`);
}

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('should display project list', async ({ page }) => {
    // Look for mat-table which is used for project list
    const projectTable = page.locator('mat-table');
    await expect(projectTable).toBeVisible({ timeout: 10000 });
  });

  test('should create a new project', async ({ page }) => {
    const projectName = `e2e-test-${Date.now()}`;
    
    // Click the FAB (floating action button) with "add" icon
    const fabButton = page.locator('button#fab mat-icon:has-text("add")');
    await expect(fabButton).toBeVisible({ timeout: 10000 });
    await fabButton.click();
    
    // Wait for dialog to appear
    await expect(page.locator('h2:has-text("Add New Project")')).toBeVisible();
    
    // Fill in project name
    await page.locator('input[placeholder="Project Name"]').fill(projectName);
    
    // Click the create button in the dialog
    const createButton = page.locator('button:has-text("Create")');
    await createButton.click();
    
    // Wait for dialog to close
    await expect(page.locator('h2:has-text("Add New Project")')).not.toBeVisible({ timeout: 10000 });
    
    // Verify project was created - it should appear in the table
    await expect(page.locator(`a:has-text("${projectName}")`)).toBeVisible({ timeout: 10000 });
  });
});
