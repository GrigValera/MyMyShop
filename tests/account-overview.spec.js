import { signInDemo } from './helpers/demoLogin.js';
import { establishDefaultDemoProfile } from './helpers/demoProfile.js';
import { test, expect } from '@playwright/test';

test('anonymous account and legacy profile routes reach sign in', async ({ page }) => {
  for (const route of ['/account', '/profile']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toHaveCount(0);
  }
});

test('demo overview, canonical profile, refresh and storage isolation', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await page.goto('/');
  await page.getByRole('button', { name: 'В корзину', exact: true }).first().click();
  const cartBefore = await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'));
  await page.evaluate(() => { localStorage.setItem('keep-unrelated', 'keep'); });
  await page.goto('/login');
  await expect(page.getByLabel('Пароль', { exact: true })).toBeVisible();
  await signInDemo(page);
  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
  await expect(page.getByText('Демо', { exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Мои покупки' }).getByRole('link', { name: 'Корзина 1 товар' })).toHaveAttribute('href', '/cart');
  await page.goto('/profile');
  await expect(page).toHaveURL('/account');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'))).toBe(cartBefore);
  expect(await page.evaluate(() => localStorage.getItem('keep-unrelated'))).toBe('keep');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /^(account|auth|mymyshop\.account|mymyshop\.auth)/i.test(key)))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => /^(account|auth|mymyshop\.account|mymyshop\.auth)/i.test(key)))).toEqual([]);
});

test('logout preserves cart, theme and locale', async ({ page }) => {
  await page.goto('/login');
  await signInDemo(page);
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('language', 'en');
    localStorage.setItem('keep-this', 'yes');
  });
  await page.getByRole('button', { name: 'Выйти' }).first().click();
  await expect(page).toHaveURL(/\/login\?next=/);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  expect(await page.evaluate(() => localStorage.getItem('language'))).toBe('en');
  expect(await page.evaluate(() => localStorage.getItem('keep-this'))).toBe('yes');
});

test('account layout and localized content fit target widths', async ({ page }) => {
  await page.goto('/login');
  await signInDemo(page);
  for (const width of [320, 390, 400, 480, 768, 769, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.getByRole('button', { name: 'Выйти' }).first()).toBeVisible();
  }
  await page.evaluate(() => { localStorage.setItem('language', 'en'); localStorage.setItem('theme', 'dark'); });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'My Account' })).toBeVisible();
  await expect(page.getByText('Demo', { exact: true })).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/dark/);
});

test('account retry keeps the unavailable card until recovery completes', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await page.route('**/api/v1/me', route => route.request().method() === 'GET' ? route.abort() : route.continue());
  await page.goto('/login');
  await signInDemo(page);
  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить данные аккаунта');
  await page.unroute('**/api/v1/me');
  let release;
  let retryRequests = 0;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/v1/me', async route => {
    if (route.request().method() === 'GET') { retryRequests += 1; await gate; }
    await route.continue();
  });
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить данные аккаунта');
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Повторить' })).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.evaluate(() => { document.querySelector('[role="alert"] + button')?.click(); document.querySelector('[role="alert"] + button')?.click(); });
  expect(retryRequests).toBe(1);
  release();
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
});
