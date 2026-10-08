import { test, expect } from '@playwright/test';
import { CART_STORAGE_KEY, loadCart, saveCart } from '../src/features/cart/store/cartPersistence.js';

const item = (overrides = {}) => ({
  id: 1, source: 'demo', title: 'Demo product', image: '', category: 'beauty',
  price: 12.5, originalPrice: 12.5, hasDiscount: false, discountPercent: 0,
  quantity: 1, ...overrides,
});

const memoryStorage = (initial) => {
  const values = new Map(initial === undefined ? [] : [[CART_STORAGE_KEY, initial]]);
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
};

test('unit: storage projects only cart fields and strips sensitive extras', () => {
  const storage = memoryStorage();
  expect(saveCart({ items: [item({ token: 'secret', email: 'private@example.com', payment: { card: '123' } })], auth: { password: 'secret' } }, storage)).toBe(true);
  const raw = storage.getItem(CART_STORAGE_KEY);
  expect(raw).not.toContain('secret');
  expect(raw).not.toContain('private@example.com');
  expect(raw).not.toContain('payment');
  expect(loadCart(storage)).toEqual({ items: [item()] });
});

test('unit: corrupt, unknown and invalid schemas safely reset', () => {
  for (const raw of ['{broken', 'null', '{}', JSON.stringify({ schemaVersion: 2, items: [item()] }), JSON.stringify({ schemaVersion: 1, items: {} })]) {
    const storage = memoryStorage(raw);
    expect(loadCart(storage)).toEqual({ items: [] });
    expect(storage.getItem(CART_STORAGE_KEY)).toBeNull();
  }
});

test('unit: invalid rows are dropped, duplicates merge by current cart identity', () => {
  const storage = memoryStorage(JSON.stringify({ schemaVersion: 1, items: [
    item(), item({ quantity: 2, title: 'second snapshot' }),
    item({ source: 'api' }), item({ id: null }), item({ quantity: 0 }),
    item({ quantity: Infinity }), item({ quantity: 1e20 }),
    item({ price: Infinity }), item({ hasDiscount: 'false' }),
  ] }));
  expect(loadCart(storage)).toEqual({ items: [item({ quantity: 3 }), item({ source: 'api' })] });
  expect(JSON.parse(storage.getItem(CART_STORAGE_KEY)).items).toHaveLength(2);
});

test('unit: unavailable storage and failed writes leave the memory cart usable', () => {
  const unavailable = { getItem: () => { throw Error('blocked'); }, removeItem: () => { throw Error('blocked'); } };
  expect(loadCart(unavailable)).toEqual({ items: [] });
  const writeFailure = { setItem: () => { throw Error('quota'); }, removeItem: () => { throw Error('blocked'); } };
  expect(saveCart({ items: [item()] }, writeFailure)).toBe(false);
  expect(saveCart({ items: [] }, writeFailure)).toBe(false);
});

test('local cart survives add, quantity, remove and empty reloads on both badges', async ({ page }) => {
  await page.goto('/products');
  const cards = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]');
  const first = await cards.first().getByRole('heading').first().textContent();
  const second = await cards.nth(1).getByRole('heading').first().textContent();
  await cards.first().getByRole('button', { name: 'В корзину' }).click();
  await cards.nth(1).getByRole('button', { name: 'В корзину' }).click();
  await page.goto('/cart');
  await page.getByRole('button', { name: `Увеличить количество: ${first}` }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: first })).toBeVisible();
  await expect(page.getByRole('heading', { name: second })).toBeVisible();
  await expect(page.locator('output')).toHaveText(['2', '1']);
  const localLink = page.getByRole('link', { name: `Подробнее о товаре: ${first}` });
  await expect(localLink).toHaveAttribute('href', /\/product\/\d+$/);
  await localLink.click();
  await expect(page).toHaveURL(/\/product\/\d+$/);
  await page.goBack();
  await expect(localLink).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect(page.locator('[id="mobile-cart-count"]')).toContainText('3');
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('header').getByText('3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Удалить из корзины: ${first}` }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: first })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: second })).toBeVisible();
  await page.getByRole('button', { name: `Удалить из корзины: ${second}` }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), CART_STORAGE_KEY)).toBeNull();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();
});

test('corrupted cart JSON does not crash the app', async ({ page }) => {
  await page.goto('/cart');
  await page.evaluate(key => localStorage.setItem(key, '{broken json'), CART_STORAGE_KEY);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), CART_STORAGE_KEY)).toBeNull();
  await expect(page.getByRole('link', { name: 'Продолжить покупки' })).toBeVisible();
});

test('API cart source survives reload and PDP Back navigation', async ({ page }) => {
  const product = { id: 991, title: 'API cart product', price: 12, category: 'beauty', thumbnail: '', images: [], description: 'Product details', rating: 4 };
  await page.route('https://dummyjson.com/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/products/categories') return route.fulfill({ json: [] });
    if (path === '/products/991') return route.fulfill({ json: product });
    return route.fulfill({ json: { products: [product], total: 1, limit: 10, skip: 0 } });
  });
  await page.goto('/products?source=api');
  await page.getByRole('button', { name: 'В корзину' }).click();
  await page.goto('/cart');
  await page.reload();
  const link = page.getByRole('link', { name: 'Подробнее о товаре: API cart product' });
  await expect(link).toHaveAttribute('href', '/product/991?source=api');
  await link.click();
  await expect(page).toHaveURL('/product/991?source=api');
  await page.goBack();
  await expect(link).toBeVisible();
});
