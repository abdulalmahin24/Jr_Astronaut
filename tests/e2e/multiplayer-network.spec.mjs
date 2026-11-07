import { expect, test } from '@playwright/test';

test('private crew room starts the server-authoritative outpost mission', async ({ page }) => {
  await page.goto('/?coop=true');
  await expect(page.getByText('NASA Multi-Crew Mission Briefing Room')).toBeVisible();
  await page.getByRole('button', { name: 'PLAY WITH FRIENDS' }).click();
  await page.getByRole('button', { name: 'Create private room' }).click();

  await expect(page.getByText('Connected to a private, four-seat crew room.')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('heading', { name: /Lunar outpost/ })).toBeVisible();
  await page.getByRole('button', { name: 'Start shared mission' }).click();
  await expect(page.getByRole('button', { name: /Propose · team vote/ })).toBeVisible();
  await page.getByRole('button', { name: /Propose · team vote/ }).click();
  await expect(page.getByRole('heading', { name: /Sol 1\/10/ })).toBeVisible();
  await expect(page.getByText('Power station')).toBeVisible();
});
