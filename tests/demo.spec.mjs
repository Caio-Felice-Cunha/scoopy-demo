import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function collectExternalRequests(page) {
  const external = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4174')) external.push(request.url());
  });
  return external;
}

function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('visitor explores the full website, gets a deterministic scoop, and sends nothing', async ({ page }) => {
  const external = collectExternalRequests(page);
  const consoleErrors = collectConsoleErrors(page);
  await page.goto('/?static=1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A little joy');
  await expect(page.getByText('221 cute things')).toBeVisible();
  await page.locator('#buildTheme').scrollIntoViewIfNeeded();
  await page.locator('#buildTheme').selectOption('Cozy Critters');
  await page.locator('#buildSize').selectOption('1');
  await page.getByRole('button', { name: 'Scoop it!' }).click();
  const first = await page.locator('#buildStage').innerText();
  await page.getByRole('button', { name: 'Scoop it!' }).click();
  expect(await page.locator('#buildStage').innerText()).toBe(first);
  await page.getByLabel('Your email').fill('demo@example.com');
  await page.getByLabel('First name').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Try demo state' }).click();
  await expect(page.getByText(/Nothing was stored or sent/)).toBeVisible();
  await expect(page.locator('#waitlistForm img')).toHaveCount(0);
  expect(external).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('engineering case exposes architecture, code, quality, and local run paths', async ({ page }) => {
  const external = collectExternalRequests(page);
  const consoleErrors = collectConsoleErrors(page);
  await page.goto('/case-study/');
  await expect(page.getByRole('heading', { name: /inspectable system underneath/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Progressive enhancement/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Small functions/i })).toBeVisible();
  await expect(page.getByText('221 / 12')).toBeVisible();
  await expect(page.getByText('npm run test:all')).toBeVisible();
  expect(external).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('desktop capability path boots the locally bundled 3D story', async ({ page }) => {
  const external = collectExternalRequests(page);
  const consoleErrors = collectConsoleErrors(page);
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__scoopBooted)).toBe(true);
  await expect(page.locator('body')).toHaveClass(/story-on/);
  expect(external).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test.describe('mobile and reduced motion', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  test('content and builder remain usable without the 3D path', async ({ page }) => {
    const external = collectExternalRequests(page);
    const consoleErrors = collectConsoleErrors(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('link', { name: 'Engineering case' }).first()).toBeVisible();
    await page.locator('#build').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Scoop it!' }).click();
    await expect(page.locator('#buildStage .peek')).toHaveCount(4);
    expect(external).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
});

for (const route of ['/?static=1', '/case-study/']) {
  test(`WCAG AA audit passes for ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach((element) => element.classList.add('in'));
    });
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const summary = violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map((node) => node.target.join(' ')),
    }));
    expect(summary).toEqual([]);
  });
}
