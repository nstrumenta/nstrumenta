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
  ]);

  if (await page.locator('button:has-text("Sign in")').isVisible()) {
    await page.locator('button:has-text("Sign in")').click();
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
    await page.locator('input[name="email"]').fill(TEST_USER_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]:has-text("Sign In")').click();
    await page.locator('h2:has-text("Sign In")').waitFor({ state: 'hidden' });
  }

  await page.goto('/');
}

async function createProject(page) {
  const projectName = `github-flow-${Date.now()}`;

  const fabButton = page.locator('button#fab mat-icon:has-text("add")');
  await expect(fabButton).toBeVisible();
  await fabButton.click();

  await expect(page.locator('h2:has-text("Add New Project")')).toBeVisible();
  await page.locator('app-new-project-dialog mat-form-field').first().locator('input').fill(projectName);
  await expect(page.locator('app-new-project-dialog mat-select')).not.toHaveAttribute('aria-disabled', 'true');
  await page.locator('app-new-project-dialog mat-select').click();
  await expect(page.locator('mat-option').first()).toBeVisible();
  await page.locator('mat-option').first().click();
  await page.locator('button:has-text("Create")').click();

  await expect(page).toHaveURL(/\/[^/]+\/[^/]+\//);

  const [, owner, project] = new URL(page.url()).pathname.split('/');
  return { owner, project, projectId: `${owner}/${project}` };
}

test.describe('GitHub repositories flow', () => {
  test('shows available repositories and links or unlinks them per project', async ({ page }) => {
    await signIn(page);
    const { owner, project, projectId } = await createProject(page);

    const state = {
      linkedRepos: new Set(['example-org/repo-a']),
    };

    await page.route(`**/api/orgs/${owner}/projects/${project}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: projectId,
          orgSlug: owner,
          slug: project,
          name: project,
        }),
      });
    });

    await page.route('**/api/github/installations**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());

      if (request.method() === 'GET' && url.pathname === '/api/github/installations') {
        expect(url.searchParams.get('projectId')).toBe(projectId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            installations: [
              {
                installationId: '12345',
                account: { login: 'example-org', type: 'Organization' },
                updatedAt: Date.now(),
                repositories: [
                  {
                    id: '1',
                    fullName: 'example-org/repo-a',
                    ...(state.linkedRepos.has('example-org/repo-a') ? { linkedProjectId: projectId } : {}),
                  },
                  {
                    id: '2',
                    fullName: 'example-org/repo-b',
                    ...(state.linkedRepos.has('example-org/repo-b') ? { linkedProjectId: projectId } : {}),
                  },
                ],
              },
            ],
          }),
        });
        return;
      }

      if (request.method() === 'POST' && url.pathname === '/api/github/installations/link') {
        const body = request.postDataJSON();
        expect(body.installationId).toBe('12345');
        expect(body.projectId).toBe(projectId);

        for (const repo of body.selectedRepoFullNames ?? []) {
          state.linkedRepos.add(repo);
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, linkedRepos: body.selectedRepoFullNames ?? [] }),
        });
        return;
      }

      if (request.method() === 'POST' && url.pathname === '/api/github/installations/12345/unlink-selected') {
        const body = request.postDataJSON();
        expect(body.selectedRepoFullNames).toEqual(['example-org/repo-a']);

        for (const repo of body.selectedRepoFullNames ?? []) {
          state.linkedRepos.delete(repo);
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, unlinkedRepos: body.selectedRepoFullNames ?? [] }),
        });
        return;
      }

      await route.fallback();
    });

    const installationsResponse = page.waitForResponse((response) => {
      return response.request().method() === 'GET'
        && new URL(response.url()).pathname === '/api/github/installations';
    });

    await page.goto(`/${owner}/${project}/repositories?installationId=12345`);
    await installationsResponse;

    await expect(page.locator('h1:has-text("GitHub Repositories")')).toBeVisible();
    const installationCard = page.locator('mat-card').filter({ hasText: 'example-org' });
    const repoARow = installationCard.locator('mat-list-item').filter({ hasText: 'example-org/repo-a' });
    const repoBRow = installationCard.locator('mat-list-item').filter({ hasText: 'example-org/repo-b' });

    await expect(installationCard.getByText('Ready to choose repositories.')).toBeVisible();
    await expect(installationCard.getByText('Linked to this project')).toBeVisible();
    await expect(installationCard.getByText('Available from GitHub')).toBeVisible();
    await expect(repoARow.locator('a.repo-link')).toBeVisible();
    await expect(repoBRow.locator('a.repo-link')).toBeVisible();
    await expect(repoARow.getByRole('button', { name: 'Unlink', exact: true })).toBeVisible();
    await expect(repoBRow.getByRole('button', { name: 'Link', exact: true })).toBeVisible();

    await repoBRow.getByRole('button', { name: 'Link', exact: true }).click();
    await expect(repoARow.getByRole('button', { name: 'Unlink', exact: true })).toBeVisible();
    await expect(repoBRow.getByRole('button', { name: 'Unlink', exact: true })).toBeVisible();

    await repoARow.getByRole('button', { name: 'Unlink', exact: true }).click();
    await expect(repoARow.getByRole('button', { name: 'Link', exact: true })).toBeVisible();
    await expect(repoBRow.getByRole('button', { name: 'Unlink', exact: true })).toBeVisible();
  });
});