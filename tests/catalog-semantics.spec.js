import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { demoProducts, demoCategories, snapshotMetadata } from '../src/features/products/data/demoProducts.js';
import { applyCatalogPipeline, normalizePriceRange } from '../src/features/products/model/catalogPipeline.js';

// Small synthetic fixtures exercise exact boundaries; production uses the full snapshot.
const fixture = [
  { id: 1, title: 'Red Balm', category: 'beauty', price: 10 },
  { id: 2, title: 'Red Mist', category: 'fragrances', price: 25 },
  { id: 3, title: 'Blue Balm', category: 'beauty', price: 25 },
  { id: 4, title: 'Red Bag', category: 'bags', price: 15 },
];

test('unit: search, multiple categories, inclusive price range, sort and exact count', () => {
  const result = applyCatalogPipeline(fixture, {
    search: 'red', categories: ['beauty', 'fragrances'], minPrice: 10, maxPrice: 25, sort: 'desc',
  });
  expect(result.products.map(product => product.id)).toEqual([2, 1]);
  expect(result.count).toBe(2);
  expect(applyCatalogPipeline(fixture, { categories: ['beauty', 'fragrances'] }).count).toBe(3);
  expect(applyCatalogPipeline(fixture, { categories: ['beauty'] }).count).toBe(2);
});

test('unit: boundaries, empty and invalid values have documented behavior', () => {
  expect(normalizePriceRange('', 'n/a')).toEqual({ min: null, max: null });
  expect(normalizePriceRange('  ', '')).toEqual({ min: null, max: null });
  expect(normalizePriceRange('-5', 'Infinity')).toEqual({ min: null, max: null });
  expect(applyCatalogPipeline(fixture, { minPrice: 25, maxPrice: 25 }).count).toBe(2);
  expect(applyCatalogPipeline(fixture, { minPrice: 30, maxPrice: 20 }).count).toBe(0);
  expect(applyCatalogPipeline(fixture, { minPrice: 'invalid' }).count).toBe(4);
});

test('unit: equal-price sorting is stable and source data is unchanged', () => {
  const before = fixture.map(product => product.id);
  const desc = applyCatalogPipeline(fixture, { sort: 'desc' }).products;
  expect(desc.map(product => product.id)).toEqual([2, 3, 4, 1]);
  expect(fixture.map(product => product.id)).toEqual(before);
});

test('unit: snapshot completeness, identity, categories and checksum', () => {
  const bytes = readFileSync(new URL('../src/features/products/data/products.snapshot.json', import.meta.url));
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(snapshotMetadata.sha256);
  expect(snapshotMetadata.formatVersion).toBe(1);
  expect(snapshotMetadata.source).toBe('https://dummyjson.com/products?limit=0');
  expect(snapshotMetadata.total).toBe(194);
  expect(demoProducts).toHaveLength(snapshotMetadata.total);
  expect(new Set(demoProducts.map(product => product.id)).size).toBe(snapshotMetadata.total);
  expect([...new Set(demoProducts.map(product => product.category))].sort()).toEqual(snapshotMetadata.categories);
  expect(demoCategories.map(category => category.slug)).toEqual(snapshotMetadata.categories);
  for (const product of demoProducts) {
    for (const field of ['id', 'title', 'category', 'price', 'rating', 'stock', 'description', 'thumbnail', 'images', 'discountPercentage']) {
      expect(product).toHaveProperty(field);
      expect(product[field]).not.toBeNull();
    }
    expect(product.images.length).toBeGreaterThan(0);
    expect(product.discountPercent).toBe(product.discountPercentage);
  }
  expect(applyCatalogPipeline(demoProducts).count).toBe(194);
  expect(applyCatalogPipeline(demoProducts, { categories: ['beauty', 'fragrances'] }).count).toBe(10);
});

test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.dummyjson.com/**', route => route.abort());
});

test('integration: full local snapshot, details and fallback work without DummyJSON', async ({ page }) => {
  let apiCalls = 0;
  await page.route('https://dummyjson.com/**', route => { apiCalls += 1; return route.abort(); });
  await page.goto('/products');
  await expect(page.getByText('194 товаров найдено')).toBeVisible();
  await expect(page.locator('a[href^="/product/"]')).toHaveCount(194);
  await expect.poll(() => page.locator('img[alt="Essence Mascara Lash Princess"]').evaluate(image => image.naturalWidth)).toBe(400);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByText('194 товаров найдено')).toBeVisible();
  await page.getByRole('textbox', { name: 'Поиск' }).fill('mascara');
  await expect(page.getByText('1 товаров найдено')).toBeVisible();
  await page.getByRole('heading', { name: 'Essence Mascara Lash Princess' }).click();
  await expect(page).toHaveURL('/product/1');
  await expect(page.getByRole('heading', { name: 'Essence Mascara Lash Princess' })).toBeVisible();
  expect(apiCalls).toBe(0);
});

test('regression: catalog opens local details with DummyJSON blocked before first load', async ({ page }) => {
  const uncaughtErrors = [];
  let apiCalls = 0;
  const failedLocalRequests = [];
  page.on('pageerror', error => uncaughtErrors.push(error.stack || error.message));
  await page.route('https://dummyjson.com/**', route => { apiCalls += 1; return route.abort(); });
  page.on('requestfailed', request => {
    if (request.url().startsWith('http://127.0.0.1:4173/')) failedLocalRequests.push(request.url());
  });

  await page.goto('/products');
  await expect(page.getByText('194 товаров найдено')).toBeVisible();
  await page.getByRole('link', { name: /Essence Mascara Lash Princess/ }).click();
  await expect(page).toHaveURL('/product/1');
  await expect(page.getByRole('heading', { level: 1, name: 'Essence Mascara Lash Princess' })).toBeVisible();
  await expect(page.getByText('$9.99', { exact: true })).toBeVisible();
  await expect(page.getByText('The Essence Mascara Lash Princess is a popular mascara', { exact: false })).toBeVisible();
  await expect.poll(() => page.getByRole('img', { name: 'Essence Mascara Lash Princess - 1' }).evaluate(image => image.naturalWidth)).toBe(400);
  expect(apiCalls).toBe(0);
  expect(failedLocalRequests).toEqual([]);
  expect(uncaughtErrors).toEqual([]);
});

test('regression: direct local product route works with DummyJSON blocked', async ({ page }) => {
  const uncaughtErrors = [];
  let apiCalls = 0;
  page.on('pageerror', error => uncaughtErrors.push(error.stack || error.message));
  await page.route('https://dummyjson.com/**', route => { apiCalls += 1; return route.abort(); });

  await page.goto('/product/1');
  await expect(page.getByRole('heading', { level: 1, name: 'Essence Mascara Lash Princess' })).toBeVisible();
  await expect(page.getByText('$9.99', { exact: true })).toBeVisible();
  await expect(page.getByText('The Essence Mascara Lash Princess is a popular mascara', { exact: false })).toBeVisible();
  await expect.poll(() => page.getByRole('img', { name: 'Essence Mascara Lash Princess - 1' }).evaluate(image => image.naturalWidth)).toBe(400);
  expect(apiCalls).toBe(0);
  expect(uncaughtErrors).toEqual([]);
});

test('E2E: multiple categories, price, combined filters and reset', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await page.getByRole('button', { name: 'Beauty' }).click();
  await page.getByRole('button', { name: 'Fragrances' }).click();
  await expect(page.getByText('10 товаров найдено')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Beauty' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Fragrances' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Применить' }).click();
  await page.getByRole('textbox', { name: 'Поиск' }).fill('red');
  await expect(page.getByText('2 товаров найдено')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Red Lipstick' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Red Nail Polish' })).toBeVisible();
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await page.getByLabel('Цена от').fill('10');
  await page.getByLabel('Цена до').fill('100');
  await expect(page.getByText('1 товаров найдено')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Red Nail Polish' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page.getByRole('heading', { name: 'Red Lipstick' })).toBeVisible();
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await page.getByRole('button', { name: 'Сбросить все' }).click();
  await expect(page.getByText('194 товаров найдено')).toBeVisible();
  await expect(page.getByTestId('active-filters')).toContainText('нет');
});

test('regression: existing 400 ms debounce is preserved in local mode', async ({ page }) => {
  await page.clock.install();
  await page.goto('/products');
  await expect(page.getByText('194 товаров найдено')).toBeVisible();
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000);
  await page.getByRole('textbox', { name: 'Поиск' }).fill('mascara');
  await expect(page.getByRole('status', { name: 'Загрузка товаров...' })).toBeVisible();
  await page.clock.runFor(399);
  await expect(page.getByRole('heading', { name: 'Essence Mascara Lash Princess' })).toHaveCount(0);
  await page.clock.runFor(1);
  await expect(page.getByRole('heading', { name: 'Essence Mascara Lash Princess' })).toBeVisible();
});

test('regression: local filtered product can still be added to cart', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('textbox', { name: 'Поиск' }).fill('mascara');
  await expect(page.getByRole('heading', { name: 'Essence Mascara Lash Princess' })).toBeVisible();
  await page.getByRole('link', { name: /Essence Mascara Lash Princess/ }).getByRole('button', { name: 'В корзину' }).click();
  await page.getByRole('button', { name: 'Cart', exact: true }).click();
  await expect(page.getByRole('banner').getByText('Essence Mascara Lash Princess', { exact: true })).toBeVisible();
});
