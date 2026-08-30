import { test, expect } from '@playwright/test';

test('visitor filters, scoops, and submits no data externally', async ({ page }) => {
  const external = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4174')) external.push(request.url());
  });
  await page.goto('/');
  await page.getByLabel('Category').selectOption('tops');
  await expect(page.getByText(/pieces match/)).toBeVisible();
  await page.getByRole('button', { name: 'Scoop it!' }).click();
  await expect(page.getByRole('heading', { name: 'Your edit is ready.' })).toBeVisible();
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByRole('button', { name: 'Try demo state' }).click();
  await expect(page.getByRole('status')).toContainText('not stored or sent');
  expect(external).toEqual([]);
});
