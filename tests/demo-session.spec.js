import { signInDemo } from './helpers/demoLogin.js';
import { establishDefaultDemoProfile } from './helpers/demoProfile.js';
import { test, expect } from '@playwright/test';
import { cleanupLegacyCredentials, LEGACY_KEYS } from '../src/features/auth/api/authService.js';
import { sessionService } from '../src/features/auth/api/sessionService.js';

test('legacy cleanup preserves unrelated storage', () => {
  const values = new Map([...LEGACY_KEYS.map(key => [key, 'synthetic-demo']), ['cart', 'keep-cart'], ['theme', 'dark']]);
  cleanupLegacyCredentials({ removeItem: key => values.delete(key) });
  expect(Object.fromEntries(values)).toEqual({ cart: 'keep-cart', theme: 'dark' });
});

test('session begins loading and has no browser token', () => {
  expect(sessionService.getInitialSession()).toEqual({ status: 'loading', user: null, mode: null, error: null, canDemoSignIn: false });
});

for (const width of [320, 390, 1280]) {
  test(`demo session restores and logs out at ${width}px`, async ({ page }, testInfo) => {
    await establishDefaultDemoProfile(testInfo);
    await page.setViewportSize({ width, height: 900 });
    const requests = [];
    page.on('request', request => requests.push(request));
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login\?next=/);
    await signInDemo(page);
    await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
    await page.getByRole('button', { name: 'Выйти' }).first().click();
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.reload();
    await expect(page.locator('main').getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
    const stored = await page.evaluate(() => [Object.entries(localStorage), Object.entries(sessionStorage)]);
    expect(JSON.stringify(stored)).not.toMatch(/password|credential|mock_|auth_|token/i);
    for (const request of requests) {
      if (request.url().includes('/api/v1/session') && request.method() === 'POST') {
        expect(JSON.parse(request.postData())).toEqual({ email: 'demo@mymyshop.dev', password: 'DemoShop-2026!' });
      }
      expect(request.url()).not.toMatch(/password|credential|token/i);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('forged legacy storage grants no access and is cleaned', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of ['mock_users', 'mock_current_user', 'mock_token', 'auth_user', 'auth_token']) storage.setItem(key, 'fake-admin');
      storage.setItem('unrelated', 'keep-other');
    }
  });
  await page.reload();
  expect(await page.evaluate(() => [localStorage, sessionStorage].map(storage => [storage.getItem('mock_token'), storage.getItem('unrelated')]))).toEqual([[null, 'keep-other'], [null, 'keep-other']]);
  await page.goto('/admin');
  await expect(page).toHaveURL('/');
});

test('cart persists across sign-in, logout and refresh', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'В корзину', exact: true }).first().click();
  const cart = await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'));
  await page.goto('/login');
  await signInDemo(page);
  await expect(page).toHaveURL('/account');
  await page.getByRole('button', { name: 'Выйти' }).first().click();
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'))).toBe(cart);
});

test('desktop demo controls work by keyboard and drawer', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/login');
  const start = page.locator('main').getByRole('button', { name: 'Войти', exact: true });
  await page.getByLabel('Электронная почта').fill('demo@mymyshop.dev');
  await page.getByLabel('Пароль', { exact: true }).fill('DemoShop-2026!');
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
  await page.getByRole('link', { name: 'MyMy Shop' }).click();
  await page.getByRole('button', { name: 'Профиль' }).click();
  await expect(page.getByRole('link', { name: 'Личный кабинет' })).toBeVisible();
  const end = page.getByRole('button', { name: 'Выйти' });
  await end.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
});
