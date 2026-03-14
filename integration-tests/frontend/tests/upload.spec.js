import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error(
    'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required'
  )
}

async function signIn(page) {
  await page.goto(FRONTEND_URL);
  
  // Click the "Sign in" button in the navbar
  // Using try/catch to handle case where we might be logged in (though unlikely in fresh test)
  if (await page.locator('button:has-text("Sign in")').isVisible()) {
    await page.locator('button:has-text("Sign in")').click();
    
    // Wait for login dialog to appear
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
    
    // Fill in email and password
    await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
    
    // Submit
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
  }
  
  // Wait for successful login - account menu button should appear
  // Matching projects.spec.js selector
  await expect(page.locator('button[mat-icon-button]').first()).toBeVisible({ timeout: 10000 });
  
  // Navigate to projects page
  await page.goto(`${FRONTEND_URL}/projects`);
}

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs to debug failures
    page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
    
    // Capture network errors
    page.on('response', async response => {
        if (response.status() >= 400) {
            console.log(`Request failed: ${response.status()} ${response.url()}`);
            if (response.status() === 406) {
                try {
                   console.log(`406 Response headers: ${JSON.stringify(response.headers())}`);
                   console.log(`406 Response body: ${await response.text()}`);
                } catch (e) {
                   console.log('Could not read response body');
                }
            }
        }
    });
    
    await signIn(page);
    // Removed duplicate page.goto here since signIn does it

    // Wait for either the project list or the "No projects" state
    const projectTable = page.locator('mat-table');

    try {
      // If project table is found, select the first project
      await expect(projectTable).toBeVisible({ timeout: 5000 });
      // Click the link in the first row
      await page.locator('mat-row a').first().click();
    } catch (e) {
      // If table is not visible, maybe we need to create a project
      console.log('Project table not found, attempting to create project...');
      const fabButton = page.locator('button#fab mat-icon:has-text("add")');
      if (await fabButton.isVisible()) {
        await fabButton.click();
        const projectName = `test-proj-${Date.now()}`;
        await page
          .locator('input[placeholder="Project Name"]')
          .fill(projectName);
        
        // Click create
        await page.locator('button:has-text("Create")').click();
        
        // Check for error message in dialog first
        const errorMsg = page.locator('.error-message mat-error');
        // Give time for api call to potentially fail
        if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
             const text = await errorMsg.textContent();
             throw new Error(`Failed to create project in dialog: ${text}`);
        }

        // Wait for the application to signal that navigation is complete
        try {
            await page.waitForFunction(() => (window)._projectNavigationComplete === true, null, { timeout: 10000 });
        } catch (navError) {
             console.log('Navigation event timed out. Checking current URL...');
        }
        
        // After creation, we expect to be redirected to the project page
        // The URL should contain /projects/<projectName>
        await expect(page).toHaveURL(new RegExp(`/projects/${projectName}`), { timeout: 5000 });
      } else {
        throw new Error('Project table and Add button not found');
      }
    }

    // Ensure we are in the data view and the FAB is ready
    await expect(page).toHaveURL(/\/data/);
    await expect(page.locator('button#fab')).toBeVisible({ timeout: 10000 });
  });

  test('should upload a file via toolbar', async ({ page }) => {
    const filename = `test-upload-${Date.now()}.txt`;
    const fileContent = 'Hello Playwright Upload';
    const fileBuffer = Buffer.from(fileContent);

    // Set up response listener BEFORE triggering the upload.
    // The upload flow is: POST to MCP for signed URL, then PUT to storage.googleapis.com.
    const uploadResponsePromise = page.waitForResponse(
      response => response.url().includes('storage.googleapis.com') && response.request().method() === 'PUT',
      { timeout: 30000 }
    );

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button#fab').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: filename,
      mimeType: 'text/plain',
      buffer: fileBuffer,
    });

    // Wait for the GCS PUT response - this is the definitive upload result.
    // No need to wait for Cloud Function indexing in Firestore.
    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status()).toBeLessThan(400);
  });
});
