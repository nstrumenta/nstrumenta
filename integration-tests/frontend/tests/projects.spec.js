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
    
    // Capture console messages to verify success
    let projectCreated = false;
    page.on('console', msg => {
      const text = msg.text();
      console.log('Browser console:', text);
      if (text.includes('Project created successfully')) {
        projectCreated = true;
      }
    });
    
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
    
    // Wait for success message in console (project creation is async)
    await page.waitForTimeout(3000);
    
    // Verify project was created based on console output
    if (!projectCreated) {
      const errorMessage = await page.locator('.error-message mat-error').textContent().catch(() => '');
      throw new Error(`Project creation failed. Error: ${errorMessage}`);
    }
    
    console.log(`Project ${projectName} created successfully!`);
  });
});
