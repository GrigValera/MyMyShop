import { test, expect } from '@playwright/test';
import { demoAccountAdapter } from '../src/features/account/api/demoAccountAdapter.js';
import { accountService } from '../src/features/account/api/accountService.js';

test('account service exposes a separate, static demo overview', async () => {
  const fixture = { id: 'demo', displayName: 'Demo User', email: 'demo@example.test', initials: 'DU' };
  expect(await demoAccountAdapter.getOverview()).toEqual(fixture);
  expect(await accountService.getOverview()).toEqual({ status: 'success', data: fixture });
});

test('anonymous account and legacy profile routes reach sign in', async ({ page }) => {
  for (const route of ['/account', '/profile']) {
    await page.goto(route);
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: 'Мой аккаунт' })).toHaveCount(0);
    await expect(page.getByText('demo@example.test')).toHaveCount(0);
  }
});

test('demo overview, canonical profile, refresh, and storage isolation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'В корзину', exact: true }).first().click();
  const cartBefore = await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'));
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('language', 'ru');
    localStorage.setItem('keep-unrelated', 'keep');
  });
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('entered@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('secret-demo-password');
  await page.getByRole('button', { name: 'Войти в демо' }).click();
  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('heading', { name: 'Мой аккаунт' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
  await expect(page.getByText('demo@example.test')).toBeVisible();
  await expect(page.getByText('entered@example.test')).toHaveCount(0);
  await expect(page.getByText('Демо-аккаунт')).toBeVisible();
  await expect(page.getByText('В корзине 1 товар')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Открыть корзину' })).toHaveAttribute('href', '/cart');
  await expect(page.getByRole('link', { name: 'Смотреть товары' })).toHaveAttribute('href', '/products');
  await page.goto('/profile');
  await expect(page).toHaveURL('/login'); // A direct navigation reloads the memory-only session.
  await expect(page.getByText('demo@example.test')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'))).toBe(cartBefore);
  expect(await page.evaluate(() => localStorage.getItem('keep-unrelated'))).toBe('keep');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /^(account|auth|mymyshop\.account|mymyshop\.auth)/i.test(key)))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => /^(account|auth|mymyshop\.account|mymyshop\.auth)/i.test(key)))).toEqual([]);
});

test('legacy route redirects within an active session and logout preserves cart, theme and locale', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('someone@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('demo-password');
  await page.getByRole('button', { name: 'Войти в демо' }).click();
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('language', 'en');
    localStorage.setItem('keep-this', 'yes');
    history.pushState({}, '', '/profile');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveURL('/account');
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL('/login');
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  expect(await page.evaluate(() => localStorage.getItem('language'))).toBe('en');
  expect(await page.evaluate(() => localStorage.getItem('keep-this'))).toBe('yes');
});

test('account layout and localized content fit target widths', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('demo@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('demo-password');
  await page.getByRole('button', { name: 'Войти в демо' }).click();
  for (const width of [320, 390, 400, 480, 768, 769, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    await expect(page.getByRole('heading', { name: 'Мой аккаунт' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
  }
  await page.evaluate(() => {
    localStorage.setItem('language', 'en');
    localStorage.setItem('theme', 'dark');
  });
  await page.reload();
  await expect(page).toHaveURL('/login');
  await page.getByRole('textbox', { name: 'Email' }).fill('demo@example.test');
  await page.getByLabel('Password', { exact: true }).fill('demo-password');
  await page.getByRole('button', { name: 'Sign in to demo' }).click();
  await expect(page.getByRole('heading', { name: 'My account' })).toBeVisible();
  await expect(page.getByText('Demo account', { exact: true })).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/dark/);
});
