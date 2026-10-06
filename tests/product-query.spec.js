import { test, expect } from '@playwright/test';
import { buildProductsQuery } from '../src/features/products/api/productsApi.js';

const product = (id, title, category = 'beauty') => ({
  id, title, category, price: id, rating: 4,
  images: ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E'],
});

test('unit: query parameters use the search, category and page', () => {
  const search = new URL(buildProductsQuery({ searchQuery: ' red & blue ' }, 2), 'https://dummyjson.com/');
  expect(search.pathname).toBe('/products/search');
  expect(search.searchParams.get('q')).toBe('red & blue');
  expect(search.searchParams.get('skip')).toBe('20');
  expect(search.searchParams.get('limit')).toBe('10');
  const category = new URL(buildProductsQuery({ category: 'skin-care' }, 1), 'https://dummyjson.com/');
  expect(category.pathname).toBe('/products/category/skin-care');
  expect(category.searchParams.get('skip')).toBe('10');
});

test('E2E: fast typing waits 400 ms, a pause starts a new search, and clearing restores catalog', async ({ page }) => {
  const searchRequests = [];
  let catalogRequests = 0;
  await page.clock.install();
  await page.route('https://dummyjson.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/categories') return route.fulfill({ json: [] });
    const query = url.searchParams.get('q');
    if (query) searchRequests.push(query);
    else catalogRequests += 1;
    const title = query ? `${query} Result` : 'Catalog Result';
    return route.fulfill({ json: { products: [product(query ? query.length + 10 : 1, title)], total: 1, limit: 10, skip: 0 } });
  });
  await page.goto('/products?source=api');
  await expect(page.getByRole('heading', { name: 'Catalog Result' })).toBeVisible();
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000);
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.fill('l');
  await search.fill('li');
  await search.fill('lip');
  await expect(search).toHaveValue('lip');
  await expect(page.getByRole('status', { name: 'Загрузка товаров...' })).toBeVisible();
  expect(searchRequests).toEqual([]);
  await page.clock.runFor(399);
  expect(searchRequests).toEqual([]);
  await page.clock.runFor(1);
  await page.clock.resume();
  await expect(page.getByRole('heading', { name: 'lip Result' })).toBeVisible();
  expect(searchRequests).toEqual(['lip']);

  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000);
  await search.fill('lips');
  await page.clock.runFor(400);
  await page.clock.resume();
  await expect(page.getByRole('heading', { name: 'lips Result' })).toBeVisible();
  expect(searchRequests).toEqual(['lip', 'lips']);

  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000);
  await search.fill('');
  await expect(search).toHaveValue('');
  await page.clock.runFor(399);
  expect(catalogRequests).toBe(1);
  await page.clock.runFor(1);
  await page.clock.resume();
  await expect(page.getByRole('heading', { name: 'Catalog Result' })).toBeVisible();
});

test('E2E: category change during debounce never requests the stale search', async ({ page }) => {
  const searchRequests = [];
  await page.clock.install();
  await page.route('https://dummyjson.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/categories') return route.fulfill({ json: [{ slug: 'fragrances', name: 'Fragrances' }] });
    const query = url.searchParams.get('q');
    if (query) searchRequests.push(query);
    const item = query === 'old' ? product(11, 'Old Result')
      : query === 'new' ? product(12, 'New Fragrance Result', 'fragrances')
        : product(1, 'Catalog Result');
    return route.fulfill({ json: { products: [item], total: 1, limit: 10, skip: 0 } });
  });
  await page.goto('/products?source=api');
  await expect(page.getByRole('heading', { name: 'Catalog Result' })).toBeVisible();
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000);
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.fill('old');
  await page.clock.runFor(400);
  await page.clock.resume();
  await expect(page.getByRole('heading', { name: 'Old Result' })).toBeVisible();
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 60_000);
  await search.fill('new');
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await page.getByRole('button', { name: 'Fragrances' }).click();
  await page.clock.runFor(399);
  expect(searchRequests).toEqual(['old']);
  await page.clock.runFor(1);
  await page.clock.resume();
  await expect(page.getByRole('heading', { name: 'New Fragrance Result' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Old Result' })).toHaveCount(0);
  expect(searchRequests).toEqual(['old', 'new']);
});

test('integration: search pages render and category changes keep separate results', async ({ page }) => {
  const requests = [];
  await page.route('https://dummyjson.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/categories') {
      return route.fulfill({ json: [{ slug: 'beauty', name: 'Beauty' }, { slug: 'fragrances', name: 'Fragrances' }] });
    }
    requests.push(`${url.pathname}?${url.searchParams}`);
    const skip = Number(url.searchParams.get('skip'));
    const title = url.pathname === '/products/search' ? 'Search Result' : url.pathname.includes('beauty') ? 'Beauty Result' : url.pathname.includes('fragrances') ? 'Fragrance Result' : 'Catalog Result';
    const id = title === 'Search Result' ? 100 : title === 'Beauty Result' ? 200 : title === 'Fragrance Result' ? 300 : 1;
    const category = title === 'Fragrance Result' ? 'fragrances' : 'beauty';
    await route.fulfill({ json: { products: [product(id + skip, `${title} ${skip}`, category)], total: 11, limit: 10, skip } });
  });
  await page.goto('/products?source=api');
  await expect(page.getByRole('heading', { name: 'Catalog Result 0' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Поиск' }).fill('lip');
  await expect(page.getByRole('heading', { name: 'Search Result 0' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Catalog Result 0' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Search Result 10' })).toBeVisible();
  expect(requests.some(request => request.includes('/products/search?') && request.includes('q=lip') && request.includes('skip=10'))).toBe(true);
  await page.getByRole('textbox', { name: 'Поиск' }).fill('');
  await expect(page.getByRole('heading', { name: 'Catalog Result 0' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Search Result 0' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await page.getByRole('button', { name: 'Beauty' }).click();
  await expect(page.getByRole('heading', { name: 'Beauty Result 0' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Beauty Result 10' })).toBeVisible();
  await page.getByRole('button', { name: 'Beauty' }).click();
  await page.getByRole('button', { name: 'Fragrances' }).click();
  await expect(page.getByRole('heading', { name: 'Fragrance Result 0' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Beauty Result 0' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Fragrance Result 10' })).toBeVisible();
  await page.getByRole('button', { name: 'Fragrances' }).click();
  await page.getByRole('button', { name: 'Beauty' }).click();
  await expect(page.getByRole('heading', { name: 'Beauty Result 0' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fragrance Result 0' })).toHaveCount(0);
  for (const category of ['beauty', 'fragrances']) {
    expect(requests.some(request => request.includes(`/products/category/${category}?`) && request.includes('skip=0'))).toBe(true);
    expect(requests.some(request => request.includes(`/products/category/${category}?`) && request.includes('skip=10'))).toBe(true);
  }
});

test('E2E: late search response cannot replace the current search', async ({ page }) => {
  let releaseOld;
  const oldResponse = new Promise(resolve => { releaseOld = resolve; });
  let markOldRequested;
  const oldRequested = new Promise(resolve => { markOldRequested = resolve; });
  let markOldDelivered;
  const oldDelivered = new Promise(resolve => { markOldDelivered = resolve; });
  await page.route('https://dummyjson.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/categories') return route.fulfill({ json: [] });
    const q = url.searchParams.get('q');
    if (q === 'old') {
      markOldRequested();
      await oldResponse;
    }
    const title = q === 'new' ? 'New Search' : q === 'old' ? 'Old Search' : 'Catalog';
    await route.fulfill({ json: { products: [product(q === 'new' ? 2 : 1, title)], total: 1, limit: 10, skip: 0 } });
    if (q === 'old') markOldDelivered();
  });
  await page.goto('/products?source=api');
  await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible();
  const search = page.getByRole('textbox', { name: 'Поиск' });
  await search.fill('old');
  await oldRequested;
  await search.fill('new');
  await expect(page.getByRole('heading', { name: 'New Search' })).toBeVisible();
  releaseOld();
  await oldDelivered;
  await expect(page.getByRole('heading', { name: 'Old Search' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'New Search' })).toBeVisible();
});

test('E2E: empty results and retry after an API error', async ({ page }) => {
  let attempts = 0;
  let releaseInitial;
  const initialResponse = new Promise(resolve => { releaseInitial = resolve; });
  await page.route('https://dummyjson.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/categories') return route.fulfill({ json: [] });
    if (url.searchParams.get('q') === 'retry' && ++attempts === 1) {
      await initialResponse;
      return route.fulfill({ status: 503, body: 'Unavailable' });
    }
    return route.fulfill({ json: { products: [], total: 0, limit: 10, skip: 0 } });
  });
  await page.goto('/products?source=api');
  await expect(page.getByRole('heading', { name: 'Каталог пока пуст' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Поиск' }).fill('retry');
  await expect(page.getByRole('status', { name: 'Загрузка товаров...' })).toBeVisible();
  releaseInitial();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByText('Товары не найдены')).toBeVisible();
  expect(attempts).toBe(2);
});

test('E2E: failed next page keeps current products and retries that page', async ({ page }) => {
  let nextAttempts = 0;
  let releaseRetry;
  const retryResponse = new Promise(resolve => { releaseRetry = resolve; });
  await page.route('https://dummyjson.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/categories') return route.fulfill({ json: [] });
    const skip = Number(url.searchParams.get('skip'));
    if (skip === 10 && ++nextAttempts === 1) return route.fulfill({ status: 503, body: 'Unavailable' });
    if (skip === 10) await retryResponse;
    return route.fulfill({ json: {
      products: [product(skip + 1, `Page Item ${skip}`)], total: 11, limit: 10, skip,
    } });
  });
  await page.goto('/products?source=api');
  await expect(page.getByRole('heading', { name: 'Page Item 0' })).toBeVisible();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Page Item 0' })).toBeVisible();
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByText('Загрузка товаров...')).toBeVisible();
  releaseRetry();
  await expect(page.getByRole('heading', { name: 'Page Item 10' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Page Item 0' })).toBeVisible();
  expect(nextAttempts).toBe(2);
});

test('E2E: cart still works after search and category changes', async ({ page }) => {
  await page.route('https://dummyjson.com/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/categories') return route.fulfill({ json: [{ slug: 'fragrances', name: 'Fragrances' }] });
    const searched = url.pathname === '/products/search';
    const selected = url.pathname === '/products/category/fragrances';
    const item = searched ? product(101, 'Search Item') : selected ? product(202, 'Fragrance Item', 'fragrances') : product(1, 'Catalog Item');
    return route.fulfill({ json: { products: [item], total: 1, limit: 10, skip: 0 } });
  });
  await page.goto('/products?source=api');
  await page.getByRole('textbox', { name: 'Поиск' }).fill('item');
  await expect(page.getByRole('heading', { name: 'Search Item' })).toBeVisible();
  await page.getByRole('button', { name: 'В корзину' }).click();
  await page.getByRole('textbox', { name: 'Поиск' }).fill('');
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await page.getByRole('button', { name: 'Fragrances' }).click();
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page.getByRole('heading', { name: 'Fragrance Item' })).toBeVisible();
  await page.getByRole('button', { name: 'В корзину' }).click();
  await page.getByRole('button', { name: 'Cart', exact: true }).click();
  await expect(page.getByRole('banner').getByText('Search Item', { exact: true })).toBeVisible();
  await expect(page.getByRole('banner').getByText('Fragrance Item', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Перейти в корзину' }).click();
  await expect(page).toHaveURL('/cart');
  await expect(page.getByRole('heading', { name: 'Search Item' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fragrance Item' })).toBeVisible();
});
