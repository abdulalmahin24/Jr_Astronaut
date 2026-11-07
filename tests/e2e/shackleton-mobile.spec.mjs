import { expect, test } from '@playwright/test';

test('campaign opens Shackleton, completes a run, and returns to the lunar-ice notebook', async ({ page }) => {
  test.setTimeout(60_000);
  await page.route('https://api.nasa.gov/**', (route) =>
    route.fulfill({ status: 503, body: 'Offline in the smoke test.' }),
  );
  await page.goto('/');
  await page.evaluate(() => {
    window.location.hash = '#/campaign';
  });

  await page.getByRole('button', { name: /Launch Shackleton Ice Run/ }).click();
  await page.getByRole('button', { name: 'Start lunar rover run' }).click();
  await expect(page.getByRole('heading', { name: 'Shackleton Ice Run' })).toBeVisible();
  await page.getByRole('button', { name: 'Start rover run' }).click();

  await page.keyboard.down('w');
  try {
    await expect(page.getByRole('heading', { name: 'Mission Autopsy' })).toBeVisible({ timeout: 25_000 });
  } finally {
    await page.keyboard.up('w');
  }

  await page.getByRole('button', { name: 'Review the Artemis lunar-ice lesson' }).click();
  await expect(page).toHaveURL(/#\/learning\?tab=NOTEBOOK/);
  await expect(page.getByRole('button', { name: 'Student Notebook' })).toBeVisible();
});
