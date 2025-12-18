import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

test.describe('Debug Authentication', () => {
  test('debug sign in flow', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    console.log('Page loaded, looking for sign in button');
    
    // Check if sign in button exists
    const signInButton = page.locator('button:has-text("Sign in")');
    const hasSignIn = await signInButton.count();
    console.log(`Found ${hasSignIn} sign-in buttons`);
    
    if (hasSignIn > 0) {
      await signInButton.click();
      console.log('Clicked sign in button');
      
      // Wait for dialog
      await page.waitForTimeout(2000);
      
      // Check what's on page now
      const html = await page.content();
      console.log('Page HTML after clicking sign in (first 500 chars):', html.substring(0, 500));
      
      // Try to fill form
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      
      console.log(`Email inputs found: ${await emailInput.count()}`);
      console.log(`Password inputs found: ${await passwordInput.count()}`);
      
      if (await emailInput.count() > 0) {
        await emailInput.fill(TEST_USER_EMAIL);
        await passwordInput.fill(TEST_USER_PASSWORD);
        console.log('Filled form');
        
        // Find submit button
        const submitButton = page.locator('button[type="submit"]:has-text("Sign In")');
        console.log(`Submit buttons found: ${await submitButton.count()}`);
        
        if (await submitButton.count() > 0) {
          await submitButton.click();
          console.log('Clicked submit');
          
          // Wait a bit for response
          await page.waitForTimeout(5000);
          
          // Check page state
          const finalHtml = await page.content();
          console.log('Page HTML after submit (first 500 chars):', finalHtml.substring(0, 500));
          
          // Check for any error messages
          const errorMessage = page.locator('.error-message, mat-error');
          const hasError = await errorMessage.count();
          if (hasError > 0) {
            const errorText = await errorMessage.textContent();
            console.log('Error message found:', errorText);
          }
        }
      }
    }
  });
});
