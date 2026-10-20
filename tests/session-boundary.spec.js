import { signInDemo } from './helpers/demoLogin.js';
import { establishDefaultDemoProfile } from './helpers/demoProfile.js';
import { test, expect } from '@playwright/test';

test('anonymous deep link returns after demo sign-in and survives refresh', async ({ page }) => {
  await page.goto('/account/orders/demo-2026-102');
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.locator('main').getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
  await signInDemo(page);
  await expect(page).toHaveURL('/account/orders/demo-2026-102');
  await expect(page.getByRole('heading', { name: 'Заказ № MS-2026-102' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL('/account/orders/demo-2026-102');
  await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Личный кабинет' }).click();
  await page.getByRole('button', { name: 'Выйти' }).first().click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.reload();
  await expect(page.locator('main').getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
});

test('external next cannot redirect away from demo', async ({ page }) => {
  await page.goto('/login?next=https%3A%2F%2Fevil.example');
  await signInDemo(page);
  await expect(page).toHaveURL('/account');
});

test('backend capability disables demo CTA without identity integration', async ({ page }) => {
  await page.route('**/api/v1/session', route => route.request().method() === 'GET'
    ? route.fulfill({ json: { status: 'anonymous', user: null, capabilities: { demoSignIn: false } } })
    : route.continue());
  await page.goto('/login');
  await expect(page.locator('main').getByRole('button', { name: 'Войти', exact: true })).toHaveCount(0);
  await expect(page.getByText('Вход сейчас недоступен.')).toBeVisible();
});

test('backend outage and failed logout never report success', async ({ page }) => {
  await page.route('**/api/v1/session', route => route.request().method() === 'GET' ? route.abort() : route.continue());
  await page.goto('/account');
  await expect(page.getByRole('alert')).toContainText('Не удалось');
  await expect(page.getByRole('heading', { name: 'Не удалось открыть личный кабинет' })).toBeVisible();
  await expect(page.getByRole('alert').locator('..')).toHaveCSS('border-top-style', 'solid');
  await page.unroute('**/api/v1/session');
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await signInDemo(page);
  await expect(page).toHaveURL('/account');
  await page.route('**/api/v1/session', route => route.request().method() === 'DELETE' ? route.abort() : route.continue());
  await page.getByRole('button', { name: 'Выйти' }).first().click();
  await expect(page.getByRole('alert').first()).toContainText('Не удалось выйти');
  await expect(page.getByRole('alert').first()).toHaveCSS('border-top-style', 'solid');
  await expect(page).toHaveURL('/account');
  await page.unroute('**/api/v1/session');
  await page.getByRole('button', { name: 'Выйти' }).first().click();
  await expect(page).toHaveURL(/\/login\?next=/);
});

test('protected retry retains its error card and sends one restore request', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await page.goto('/login');
  await signInDemo(page);
  await page.route('**/api/v1/session', route => route.request().method() === 'GET' ? route.abort() : route.continue());
  await page.reload();
  const error = page.getByRole('alert');
  await expect(error.getByRole('heading', { name: 'Не удалось открыть личный кабинет' })).toBeVisible();
  const before = await error.locator('..').boundingBox();
  await page.unroute('**/api/v1/session');
  let release;
  let requests = 0;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/v1/session', async route => {
    if (route.request().method() === 'GET') { requests += 1; await gate; }
    await route.continue();
  });
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(error.getByRole('heading', { name: 'Не удалось открыть личный кабинет' })).toBeVisible();
  await expect(error.getByRole('button', { name: 'Повторить' })).toBeDisabled();
  await expect(error.getByRole('button', { name: 'Повторить' })).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page).toHaveURL('/account');
  await page.evaluate(() => { const button = document.querySelector('[role="alert"] button'); button.click(); button.click(); });
  expect(requests).toBe(1);
  const after = await error.locator('..').boundingBox();
  expect(after.height).toBe(before.height);
  expect(after.width).toBe(before.width);
  release();
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
});

test('protected unavailable card stays mounted through repeated failed retries', async ({ page }) => {
  await page.goto('/login');
  await signInDemo(page);
  await page.route('**/api/v1/session', route => route.request().method() === 'GET' ? route.abort() : route.continue());
  await page.reload();
  const error = page.getByRole('alert');
  await expect(error.getByRole('heading', { name: 'Не удалось открыть личный кабинет' })).toBeVisible();
  const card = error.locator('..');
  const originalBounds = await card.boundingBox();
  const retryButton = error.getByRole('button', { name: 'Повторить' });
  const originalButtonBounds = await retryButton.boundingBox();
  await card.evaluate(element => { element.dataset.retryIdentity = 'original'; });
  await page.unroute('**/api/v1/session');
  let requests = 0;
  let release;
  await page.route('**/api/v1/session', async route => {
    if (route.request().method() !== 'GET') return route.continue();
    requests += 1;
    await new Promise(resolve => { release = resolve; });
    await route.abort();
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await retryButton.click();
    await expect(retryButton).toHaveText('Повторить');
    await expect(retryButton).toBeDisabled();
    await expect(retryButton).toHaveAttribute('aria-busy', 'true');
    await expect(retryButton.locator('[aria-hidden="true"]')).toBeVisible();
    expect(await retryButton.boundingBox()).toEqual(originalButtonBounds);
    await expect.poll(() => requests).toBe(attempt);
    await page.evaluate(() => { const button = document.querySelector('[role="alert"] button'); button.click(); button.click(); });
    expect(requests).toBe(attempt);
    await expect(card).toHaveAttribute('data-retry-identity', 'original');
    expect(await card.boundingBox()).toEqual(originalBounds);
    release();
    await expect(retryButton).toBeEnabled();
    await expect(retryButton).toHaveText('Повторить');
    await expect(retryButton).toHaveAttribute('aria-busy', 'false');
    await expect(retryButton.locator('[aria-hidden="true"]')).toBeHidden();
    await expect(error.getByRole('heading', { name: 'Не удалось открыть личный кабинет' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(card).toHaveAttribute('data-retry-identity', 'original');
    expect(await card.boundingBox()).toEqual(originalBounds);
    expect(await retryButton.boundingBox()).toEqual(originalButtonBounds);
  }
  expect(requests).toBe(2);
});

test('concurrent logout actions share one request', async ({ page }) => {
  await page.goto('/login');
  await signInDemo(page);
  await page.getByRole('button', { name: 'Профиль' }).click();
  let requests = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/v1/session', async route => {
    if (route.request().method() === 'DELETE') { requests += 1; await gate; }
    await route.continue();
  });
  await page.evaluate(() => {
    const accountButton = document.querySelector('aside button');
    const drawerButton = [...document.querySelectorAll('header button')].findLast(button => button.textContent.trim() === 'Выйти');
    if (!accountButton || !drawerButton) throw new Error('Expected account and profile drawer logout controls');
    accountButton.click();
    drawerButton.click();
  });
  await expect.poll(() => requests).toBe(1);
  release();
  await expect(page).toHaveURL('/');
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(requests).toBe(1);
});

test('account 401 rechecks session and returns to protected login without a restore loop', async ({ page }) => {
  await page.goto('/login');
  await signInDemo(page);
  let accountRequests = 0;
  let restores = 0;
  await page.route('**/api/v1/me', route => {
    accountRequests += 1;
    return route.fulfill({ status: 401, json: { code: 'unauthorized' } });
  });
  await page.route('**/api/v1/session', route => {
    if (route.request().method() === 'GET') {
      restores += 1;
      return route.fulfill({ json: { status: 'anonymous', user: null, capabilities: { demoSignIn: true } } });
    }
    return route.continue();
  });
  await page.locator('a[href="/account/profile"]').first().click();
  await expect.poll(() => accountRequests).toBeGreaterThan(0);
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.locator('main').getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
  expect(restores).toBe(1);
  await page.waitForTimeout(300);
  expect(restores).toBe(1);
});
