import { signInDemo } from './helpers/demoLogin.js';
import { establishDefaultDemoProfile } from './helpers/demoProfile.js';
import { test, expect } from '@playwright/test';

async function signIn(page) {
  await page.goto('/login');
  await signInDemo(page);
  await expect(page).toHaveURL('/account');
}

const sections = [
  ['Личный кабинет', '/account'],
  ['Личные данные', '/account/profile'],
  ['Заказы', '/account/orders'],
  ['Адреса', '/account/addresses'],
  ['Отзывы', '/account/reviews'],
  ['Настройки', '/account/settings'],
];

test('desktop account destinations share a clear shell and active state', async ({ page }) => {
  await signIn(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  const navigation = page.getByRole('navigation', { name: 'Личный кабинет' });
  for (const [label, path] of sections) {
    const link = navigation.getByRole('link', { name: label, exact: true });
    await expect(link).toHaveAttribute('href', path);
    await link.click();
    await expect(page).toHaveURL(path);
    await expect(link).toHaveAttribute('aria-current', 'page');
    await expect(navigation.getByRole('link')).toHaveCount(6);
  }
  await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
});

test('account home shows identity, direct destinations and current cart count', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await page.goto('/');
  await page.getByRole('button', { name: 'В корзину', exact: true }).first().click();
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Личный кабинет', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
  await expect(page.getByText(/История заказов — пример/)).toBeVisible();
  await expect(page.getByText('Демо', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Редактировать профиль' })).toHaveAttribute('href', '/account/profile');
  await expect(page.getByRole('navigation', { name: 'Мои покупки' }).getByRole('link', { name: 'Корзина 1 товар' })).toHaveAttribute('href', '/cart');
  await expect(page.getByText(/Имя сохраняется после обновления страницы/)).toBeVisible();
  await expect(page.getByText('Разделы аккаунта')).toHaveCount(0);
  await expect(page.getByText('Обзор')).toHaveCount(0);
  for (const [label, path] of sections.slice(2, 5)) {
    await expect(page.getByRole('navigation', { name: 'Мои покупки' }).getByRole('link', { name: label, exact: true })).toHaveAttribute('href', path);
  }
  await expect(page.getByRole('navigation', { name: 'Аккаунт' }).getByRole('link', { name: 'Настройки' })).toHaveAttribute('href', '/account/settings');
});

test('mobile home exposes destination rows without navigation overhead', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await signIn(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(page.locator('summary')).toHaveCount(0);
  const title = page.getByRole('heading', { name: 'Личный кабинет', exact: true });
  const name = page.getByRole('heading', { name: 'Demo User' });
  const edit = page.getByRole('link', { name: 'Редактировать профиль' });
  expect((await title.boundingBox()).y).toBeLessThan(130);
  expect((await name.boundingBox()).y).toBeLessThan(250);
  expect((await edit.boundingBox()).y).toBeLessThan(360);
  const purchases = page.getByRole('navigation', { name: 'Мои покупки' });
  for (const [label, path] of [['Заказы', '/account/orders'], ['Корзина Пусто', '/cart'], ['Адреса', '/account/addresses'], ['Отзывы', '/account/reviews']]) {
    await expect(purchases.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', path);
  }
  await expect(page.getByRole('navigation', { name: 'Аккаунт' }).getByRole('link', { name: 'Настройки' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
  const cart = purchases.getByRole('link', { name: 'Корзина Пусто' });
  await edit.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(cart).toBeFocused();
  await expect(cart).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/cart');
});

const mobileAccountDestinations = [
    ['Редактировать профиль', 'Личные данные', '/account/profile'],
    ['Заказы', 'Заказы', '/account/orders'],
    ['Адреса', 'Адреса', '/account/addresses'],
    ['Отзывы', 'Отзывы', '/account/reviews'],
    ['Настройки', 'Настройки', '/account/settings'],
];

for (const width of [320, 390, 400, 480, 768]) {
  test(`mobile nested account pages use back navigation at ${width}px`, async ({ page }) => {
    await signIn(page);
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    for (const [entry, heading, path] of mobileAccountDestinations) {
      await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
      await page.getByRole('link', { name: entry, exact: true }).click();
      await expect(page).toHaveURL(path);
      const title = page.getByRole('heading', { name: heading, exact: true });
      await expect(title).toBeVisible();
      await expect(page.getByRole('button', { name: 'Выйти' })).toBeHidden();
      const back = page.getByRole('link', { name: 'Личный кабинет', exact: true });
      await expect(back).toBeVisible();
      expect((await back.boundingBox()).y).toBeGreaterThanOrEqual(0);
      expect((await back.boundingBox()).y).toBeLessThan(130);
      expect((await title.boundingBox()).y).toBeLessThan(190);
      await back.click();
      await expect(page).toHaveURL('/account');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    const settings = page.getByRole('navigation', { name: 'Аккаунт' }).getByRole('link', { name: 'Настройки' });
    const logout = page.getByRole('button', { name: 'Выйти' });
    expect((await settings.boundingBox()).y + (await settings.boundingBox()).height).toBeLessThan((await logout.boundingBox()).y);
    await logout.click();
    await expect(page).toHaveURL(/\/login\?next=/);
  });
}

test('desktop sign out stays in the sidebar on nested account pages', async ({ page }) => {
  await signIn(page);
  for (const width of [769, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [label, path] of sections.slice(1)) {
      await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    }
  }
});

test('destination rows and account actions fit all target widths', async ({ page }) => {
  await signIn(page);
  for (const width of [320, 390, 400, 480, 768, 769, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    const sidebar = page.getByRole('navigation', { name: 'Личный кабинет' });
    if (width <= 768) await expect(sidebar).toBeHidden();
    else await expect(sidebar).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width <= 390) {
      const edit = await page.getByRole('link', { name: 'Редактировать профиль' }).boundingBox();
      const chat = await page.getByRole('button', { name: 'Задать вопрос' }).boundingBox();
      expect(edit.x + edit.width <= chat.x || edit.y + edit.height <= chat.y || edit.y >= chat.y + chat.height).toBeTruthy();
      const chevrons = await page.getByRole('navigation', { name: 'Мои покупки' }).locator('svg').all();
      for (const chevron of chevrons) {
        const box = await chevron.boundingBox();
        expect(box.x + box.width <= chat.x || box.y + box.height <= chat.y || box.y >= chat.y + chat.height).toBeTruthy();
      }
    }
  }
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole('navigation', { name: 'Мои покупки' }).getByRole('link', { name: 'Отзывы' }).click();
  await expect(page).toHaveURL('/account/reviews');
  await expect(page.getByRole('heading', { name: 'Отзывы' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Личный кабинет' })).toBeVisible();
});

test('future destinations keep honest localized placeholder states', async ({ page }) => {
  await signIn(page);
  await page.setViewportSize({ width: 320, height: 568 });
  const descriptions = [
    ['addresses', 'Адреса', 'Здесь можно будет управлять адресами доставки.'],
    ['reviews', 'Отзывы', 'Здесь появятся ваши отзывы и товары, ожидающие оценки.'],
    ['settings', 'Настройки', 'Здесь будут доступны настройки аккаунта.'],
  ];
  for (const [section, label, description] of descriptions) {
    if (section !== 'addresses') await page.getByRole('link', { name: 'Личный кабинет' }).click();
    await page.getByRole('navigation', { name: section === 'settings' ? 'Аккаунт' : 'Мои покупки' }).getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(`/account/${section}`);
    await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
    await expect(page.getByText('Раздел будет доступен в следующих версиях демо.')).toBeVisible();
    await expect(page.getByText(/№\s*\d+|доставлен|оплачен/i)).toHaveCount(0);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByText('EN', { exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText('Account settings will be available here.')).toBeVisible();
  await page.getByText('Dark', { exact: true }).first().click();
  await expect(page.locator('body')).toHaveClass(/dark/);
});

test('every account route requires a session and restore survives reload', async ({ page }) => {
  for (const [, path] of sections) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  }
  await signIn(page);
  await page.getByRole('navigation', { name: 'Мои покупки' }).getByRole('link', { name: 'Заказы' }).click();
  await page.reload();
  await expect(page).toHaveURL('/account/orders');
});

test('desktop sidebar supports keyboard focus and Enter', async ({ page }) => {
  await signIn(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  const navigation = page.getByRole('navigation', { name: 'Личный кабинет' });
  await navigation.getByRole('link', { name: 'Личные данные' }).focus();
  await page.keyboard.press('Tab');
  const orders = navigation.getByRole('link', { name: 'Заказы' });
  await expect(orders).toBeFocused();
  await expect(orders).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/account/orders');
  await expect(orders).toHaveAttribute('aria-current', 'page');
});

test('public and protected routes render a visible page', async ({ page }) => {
  for (const route of ['/', '/account', '/account/profile', '/account/orders', '/account/addresses', '/account/reviews', '/account/settings', '/profile', '/login', '/register', '/forgot-password', '/products', '/cart']) {
    await page.goto(route);
    if (route.startsWith('/account') || route === '/profile') await expect(page).toHaveURL(/\/login\?next=/);
    await expect(page.locator('main').getByRole('heading').first()).toBeVisible();
  }
});
