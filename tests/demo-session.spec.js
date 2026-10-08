import { test, expect } from '@playwright/test';
import { cleanupLegacyCredentials, LEGACY_KEYS } from '../src/features/auth/api/authService.js';
import { sessionService } from '../src/features/auth/api/sessionService.js';

// Используем существующий Playwright для модульного теста без новых зависимостей.
test('unit: cleanup removes only app legacy keys', () => {
  const values = new Map([...LEGACY_KEYS.map(key => [key, 'synthetic-demo']),
    ['cart', 'keep-cart'], ['theme', 'dark'], ['another_app_token', 'keep-other']]);
  cleanupLegacyCredentials({ removeItem: key => values.delete(key) });
  expect(Object.fromEntries(values)).toEqual({ cart: 'keep-cart', theme: 'dark', another_app_token: 'keep-other' });
  cleanupLegacyCredentials({ removeItem: key => values.delete(key) });
  expect(values.size).toBe(3);
});

test('unit: session contract starts anonymous and demo adapter returns display-safe fields', async () => {
  expect(sessionService.getInitialSession()).toEqual({
    status: 'anonymous', user: null, cleanupFailed: false, error: null,
  });
  // Адаптер детерминирован; очистку хранилища браузера проверяют E2E-тесты.
  const { demoSessionAdapter } = await import('../src/features/auth/api/demoSessionAdapter.js');
  expect(await demoSessionAdapter.startSession()).toEqual({
    status: 'demo', user: { id: 'demo', name: 'Demo User' },
  });
  expect(await demoSessionAdapter.endSession()).toEqual({ status: 'anonymous', user: null });
});

for (const width of [320, 390, 1280]) {
  test(`E2E ${width}px: demo login, reload ends session, login and logout`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const requests = [];
    const logs = [];
    page.on('request', request => requests.push(request));
    page.on('console', message => logs.push(message.text()));
    await page.goto('/register');
    await expect(page).toHaveURL('/login');
    await page.goto('/profile');
    await expect(page.getByRole('link', { name: 'Войти как демо-пользователь' })).toBeVisible();
    await page.goto('/login');
    await expect(page.locator('input')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Распродажа' })).toHaveCount(0);
    await page.screenshot({ path: `test-results/demo-login-${width}.png` });
    await expect(page.getByText(/Это не защищённая авторизация/)).toBeVisible();
    await page.getByRole('button', { name: 'Войти как демо-пользователь' }).click();
    await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
    await page.screenshot({ path: `test-results/demo-profile-${width}.png` });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Demo User' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Войти как демо-пользователь' })).toBeVisible();
    await page.getByRole('link', { name: 'Войти как демо-пользователь' }).click();
    await page.getByRole('button', { name: 'Войти как демо-пользователь' }).click();
    await page.getByRole('button', { name: 'Выйти', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'Demo User' })).toHaveCount(0);
    if (width < 769) {
      await page.getByRole('navigation', { name: /Основная навигация|Main navigation/ }).getByRole('link', { name: /Корзина|Cart/ }).click();
      await expect(page).toHaveURL('/cart');
    }
    const stored = await page.evaluate(() => [Object.entries(localStorage), Object.entries(sessionStorage)]);
    expect(JSON.stringify(stored)).not.toMatch(/password|credential|mock_|auth_|token/i);
    expect(logs.join('\n')).not.toMatch(/password|credential|synthetic-demo|Demo User/i);
    for (const request of requests) {
      expect(request.postData()).toBeNull();
      expect(request.headers()).not.toHaveProperty('authorization');
      expect(request.url()).not.toMatch(/password|credential|token|synthetic-demo/i);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('E2E: forged storage grants no admin access; cleanup preserves unrelated data', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of ['mock_users', 'mock_current_user', 'mock_token', 'auth_user', 'auth_token']) {
        storage.setItem(key, JSON.stringify({ role: 'admin', password: 'synthetic-demo' }));
      }
      storage.setItem('cart', 'keep-cart');
      storage.setItem('theme', 'dark');
      storage.setItem('unrelated', 'keep-other');
    }
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Войти как демо-пользователь' })).toBeVisible();
  expect(await page.evaluate(() => [localStorage, sessionStorage].map(storage => ({
    legacy: ['mock_users', 'mock_current_user', 'mock_token', 'auth_user', 'auth_token'].map(key => storage.getItem(key)),
    cart: storage.getItem('cart'), theme: storage.getItem('theme'), unrelated: storage.getItem('unrelated'),
  })))).toEqual(Array(2).fill({ legacy: Array(5).fill(null), cart: 'keep-cart', theme: 'dark', unrelated: 'keep-other' }));
  await page.goto('/admin');
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Admin Panel')).toHaveCount(0);
});

test('integration: cleanup failure is explicit and demo login stays disabled', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.removeItem = () => { throw new Error('Synthetic storage unavailable'); };
  });
  await page.goto('/login');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Войти как демо-пользователь' }).click();
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('alert')).toBeVisible();
});

test('integration: cart persists across demo start, end and reload', async ({ page }) => {
  await page.route('https://dummyjson.com/**', route => route.fulfill({ json: {
    products: [{ id: 1, title: 'Demo Lamp', price: 100, category: 'home-decoration', rating: 4.5,
      images: ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E'] }], total: 1, skip: 0, limit: 100,
  } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'В корзину', exact: true }).first().click();
  const cartBefore = await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'));
  expect(cartBefore).toBeTruthy();
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('shop-test-unrelated', 'keep-me');
  });
  await page.getByRole('button', { name: 'Войти', exact: true }).first().click();
  await page.getByRole('button', { name: 'Войти как демо-пользователь' }).click();
  expect(await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'))).toBe(cartBefore);
  await page.getByRole('button', { name: 'Выйти', exact: true }).first().click();
  expect(await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'))).toBe(cartBefore);
  await page.getByRole('button', { name: /^(Корзина|Cart)$/, exact: true }).click();
  await expect(page.getByRole('dialog').locator('output')).toHaveText('1');
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/profile');
  await expect(page.getByRole('link', { name: 'Войти как демо-пользователь' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('mymyshop.cart.v1'))).toBe(cartBefore);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
  expect(await page.evaluate(() => localStorage.getItem('shop-test-unrelated'))).toBe('keep-me');
});

test('desktop demo controls work by keyboard and profile drawer remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/login');
  const start = page.getByRole('button', { name: 'Войти как демо-пользователь' });
  await page.keyboard.press('Tab');
  await expect(start).toBeFocused();
  expect(await start.evaluate(element => element.matches(':focus-visible'))).toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
  await page.getByRole('link', { name: 'MyMy Shop' }).click();
  await page.getByRole('button', { name: 'Профиль' }).click();
  await expect(page.getByRole('link', { name: 'Мой профиль' })).toBeVisible();
  const end = page.getByRole('button', { name: 'Выйти' });
  await end.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Корзина' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
