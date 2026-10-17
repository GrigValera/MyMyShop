import { test, expect } from '@playwright/test';
import { demoOrders } from '../src/features/orders/data/demoOrders.js';
import { demoOrderAdapter } from '../src/features/orders/api/demoOrderAdapter.js';
import { orderService } from '../src/features/orders/api/orderService.js';
import { formatOrderDate, formatOrderMoney } from '../src/features/orders/model/orderPresentation.js';

async function signIn(page, language = 'ru') {
  await page.goto('/login');
  if (language === 'en') {
    await page.evaluate(() => localStorage.setItem('language', 'en'));
    await page.reload();
  }
  await page.getByRole('textbox', { name: language === 'ru' ? 'Электронная почта' : 'Email' }).fill('demo@example.test');
  await page.getByLabel(language === 'ru' ? 'Пароль' : 'Password', { exact: true }).fill('demo-password');
  await page.getByRole('button', { name: language === 'ru' ? 'Войти в демо' : 'Sign in to demo' }).click();
  await expect(page).toHaveURL('/account');
}

test('order fixture has fixed monetary snapshots and distinct states', async () => {
  expect(demoOrders.map(({ status }) => status)).toEqual(['processing', 'delivered', 'cancelled']);
  expect(demoOrders.map(({ displayNumber }) => displayNumber)).toEqual(['MS-2026-103', 'MS-2026-102', 'MS-2026-101']);
  for (const order of demoOrders) {
    expect(order.currency).toBe('USD');
    for (const item of order.items) {
      expect(item.lineTotalMinor).toBe(item.unitPriceMinor * item.quantity);
      expect(item.titleSnapshot).toBeTruthy();
      expect(item.imageSnapshot).toBeTruthy();
    }
    expect(order.totals.subtotalMinor).toBe(order.items.reduce((sum, item) => sum + item.lineTotalMinor, 0));
    expect(order.totals.totalMinor).toBe(order.totals.subtotalMinor);
  }
  expect(demoOrders[1].items).toHaveLength(2);
  expect(demoOrders[1].items[0].quantity).toBe(2);
  expect(demoOrders[1].totals.totalMinor).toBe(3997);
  const catalog = await import('../src/features/products/data/products.snapshot.json', { with: { type: 'json' } });
  const oldTitle = demoOrders[1].items[0].titleSnapshot;
  const oldPrice = demoOrders[1].items[0].unitPriceMinor;
  const catalogTitle = catalog.default[0].title;
  const catalogPrice = catalog.default[0].price;
  try {
    catalog.default[0].title = 'Updated catalog title';
    catalog.default[0].price = 999;
    expect(demoOrders[1].items[0].titleSnapshot).toBe(oldTitle);
    expect(demoOrders[1].items[0].unitPriceMinor).toBe(oldPrice);
  } finally {
    catalog.default[0].title = catalogTitle;
    catalog.default[0].price = catalogPrice;
  }
});

test('service distinguishes success, empty, not found and recoverable errors', async () => {
  expect(await orderService.listOrders()).toEqual({ status: 'success', data: demoOrders });
  expect(await orderService.getOrder('bad-id')).toEqual({ status: 'not-found' });
  const list = demoOrderAdapter.listOrders;
  const get = demoOrderAdapter.getOrder;
  try {
    demoOrderAdapter.listOrders = async () => [];
    expect(await orderService.listOrders()).toEqual({ status: 'success', data: [] });
    demoOrderAdapter.listOrders = async () => { throw new Error('Unavailable'); };
    demoOrderAdapter.getOrder = async () => { throw new Error('Unavailable'); };
    expect(await orderService.listOrders()).toEqual({ status: 'error', error: 'unavailable' });
    expect(await orderService.getOrder('demo-2026-103')).toEqual({ status: 'error', error: 'unavailable' });
  } finally {
    demoOrderAdapter.listOrders = list;
    demoOrderAdapter.getOrder = get;
  }
});

test('dates and USD amounts use language-aware Intl formatting', () => {
  expect(formatOrderDate('2026-08-14T12:00:00Z', 'ru')).toContain('августа');
  expect(formatOrderDate('2026-08-14T12:00:00Z', 'en')).toContain('August');
  expect(formatOrderMoney(3997, 'USD', 'ru')).toContain('39,97');
  expect(formatOrderMoney(3997, 'USD', 'en')).toContain('$39.97');
});

test('authenticated history and details support navigation, Back and unknown ID', async ({ page }) => {
  await signIn(page);
  await page.getByRole('navigation', { name: 'Мои покупки' }).getByRole('link', { name: 'Заказы' }).click();
  await expect(page).toHaveURL('/account/orders');
  const articles = page.getByRole('article');
  await expect(articles).toHaveCount(3);
  for (const [index, label] of ['В обработке', 'Доставлен', 'Отменён'].entries()) {
    await expect(articles.nth(index).getByText(label, { exact: true })).toBeVisible();
  }
  await expect(articles.nth(1)).toContainText('3 товара');
  await expect(articles.nth(1)).toContainText('39,97');
  await articles.nth(1).getByRole('link', { name: 'Подробнее о заказе № MS-2026-102' }).click();
  await expect(page).toHaveURL('/account/orders/demo-2026-102');
  await expect(page.getByRole('heading', { name: 'Заказ № MS-2026-102' })).toBeVisible();
  await expect(page.getByText('Цена за шт.: 9,99', { exact: false })).toBeVisible();
  await expect(page.getByText('Количество: 2', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Доставка' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Способ оплаты' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'К заказам' })).toHaveAttribute('href', '/account/orders');
  await page.goBack();
  await expect(page).toHaveURL('/account/orders');
  await page.getByRole('link', { name: 'Подробнее о заказе № MS-2026-103' }).click();
  await expect(page.getByRole('heading', { name: 'Заказ № MS-2026-103' })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/account/orders/bad-id'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('heading', { name: 'Заказ не найден' })).toBeVisible();
  await page.getByRole('link', { name: 'К заказам' }).click();
  await expect(page).toHaveURL('/account/orders');
});

test('direct details in session work; reload follows in-memory session guard', async ({ page }) => {
  await page.goto('/account/orders/demo-2026-102');
  await expect(page).toHaveURL('/login');
  await signIn(page);
  await page.evaluate(() => { history.pushState({}, '', '/account/orders/demo-2026-102'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('heading', { name: 'Заказ № MS-2026-102' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL('/login');
  await signIn(page);
  await page.getByRole('link', { name: 'Заказы', exact: true }).first().click();
  await expect(page.getByRole('article')).toHaveCount(3);
});

test('orders remain readable across widths, languages and themes', async ({ page }) => {
  await signIn(page);
  await page.getByRole('navigation', { name: 'Мои покупки' }).getByRole('link', { name: 'Заказы' }).click();
  for (const width of [320, 360, 390, 430, 768, 769, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('article')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('link', { name: 'Подробнее о заказе № MS-2026-102' }).click();
    await expect(page.getByRole('heading', { name: 'Заказ № MS-2026-102' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole('link', { name: 'К заказам' }).click();
  }
  await page.getByText('EN', { exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  await expect(page.getByText('August 14, 2026')).toBeVisible();
  await expect(page.getByText('$39.97')).toBeVisible();
  await page.getByText('Dark', { exact: true }).first().click();
  await expect(page.locator('body')).toHaveClass(/dark/);
  const detailLink = page.getByRole('link', { name: 'View order #MS-2026-102' });
  await detailLink.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(detailLink).toBeFocused();
  await expect(detailLink).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Order #MS-2026-102' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'My Account' }).getByRole('link', { name: 'Orders' })).toHaveAttribute('aria-current', 'page');
  await page.setViewportSize({ width: 320, height: 700 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('link', { name: 'Back to orders' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByText('RU', { exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Заказы' })).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/dark/);
  await page.getByText('Light', { exact: true }).first().click();
  await expect(page.locator('body')).not.toHaveClass(/dark/);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('link', { name: 'Личный кабинет' }).click();
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL('/login');
});
