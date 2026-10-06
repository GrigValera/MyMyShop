import { test, expect } from '@playwright/test';

test('mobile filters remain usable and active values match the exact local result', async ({ page }) => {
  for (const width of [320, 390, 480, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/products');
    await page.getByRole('button', { name: 'Фильтры' }).click();
    const min = page.getByRole('spinbutton', { name: 'Цена от' });
    const max = page.getByRole('spinbutton', { name: 'Цена до' });
    for (const field of [min, max]) {
      await expect.poll(async () => {
        const bounds = await field.boundingBox();
        return bounds.x + bounds.width;
      }).toBeLessThanOrEqual(width);
      const box = await field.boundingBox();
      expect(box.width).toBeGreaterThan(60);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      if (width <= 480) {
        expect(box.width).toBeGreaterThanOrEqual(width - 60);
        expect(box.height).toBeGreaterThanOrEqual(52);
      }
    }
    if (width <= 480) {
      const first = await min.boundingBox();
      const second = await max.boundingBox();
      expect(second.x).toBe(first.x);
      expect(second.width).toBe(first.width);
      expect(second.y - first.y - first.height).toBeGreaterThanOrEqual(30);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.getByRole('button', { name: 'Beauty' }).click();
  await page.getByRole('button', { name: 'Fragrances' }).click();
  await page.getByRole('button', { name: 'Применить' }).click();
  await page.getByRole('textbox', { name: 'Поиск' }).fill('red');
  await expect(page.getByTestId('results-summary')).toContainText('2 товаров найдено');
  await expect(page.getByTestId('results-summary')).toContainText('из 194 в каталоге');
  await expect(page.getByTestId('active-filters')).toContainText('beauty');
  await expect(page.getByTestId('active-filters')).toContainText('fragrances');
  await expect(page.getByTestId('active-filters')).toContainText('red');
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await page.getByRole('spinbutton', { name: 'Цена от' }).fill('10');
  await page.getByRole('spinbutton', { name: 'Цена до' }).fill('100');
  await page.getByRole('button', { name: 'Применить' }).click();
  await expect(page.getByTestId('results-summary')).toContainText('1 товаров найдено');
  await expect(page.getByRole('heading', { name: 'Red Lipstick' })).toBeVisible();
  await page.getByTestId('active-filters').getByRole('button', { name: 'Сбросить все' }).click();
  await expect(page.getByTestId('results-summary')).toContainText('194 товаров найдено');
  await expect(page.getByTestId('active-filters')).toHaveCount(0);
});

test('mobile keeps ten active conditions compact above results and exposes their values in the panel', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/products');
  const openFilters = page.getByRole('button', { name: 'Фильтры' });
  await openFilters.click();
  for (const category of ['beauty', 'fragrances', 'furniture', 'groceries', 'home-decoration', 'kitchen-accessories']) {
    await page.getByRole('button', { name: category, exact: true }).click();
  }
  await page.getByRole('spinbutton', { name: 'Цена от' }).fill('10');
  await page.getByRole('spinbutton', { name: 'Цена до' }).fill('100');
  await page.getByRole('radio', { name: 'Цена: по возрастанию' }).check();
  await page.getByRole('button', { name: 'Применить' }).click();
  await page.getByRole('textbox', { name: 'Поиск' }).fill('red');
  await expect(openFilters).toContainText('10');
  await expect(page.getByTestId('active-filters')).toBeHidden();
  await expect(page.getByTestId('results-summary')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await openFilters.click();
  const selected = page.getByTestId('drawer-active-filters');
  await expect(selected.locator('li')).toHaveCount(10);
  await expect(selected).toContainText('Поиск: red');
  await expect(selected).toContainText('Цена от: $10');
  await expect(selected).toContainText('Цена до: $100');
  for (const control of [openFilters, page.getByRole('button', { name: 'Beauty' }), page.getByRole('button', { name: 'Сбросить все' }), page.getByRole('button', { name: 'Применить' })]) {
    expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  expect((await page.getByRole('radio', { name: 'По умолчанию' }).locator('..').boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Сбросить все' }).click();
  await expect(selected).toHaveCount(0);
  await expect(openFilters).not.toContainText('10');
});

test('zero filtered results show one resettable empty state', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('textbox', { name: 'Поиск' }).fill('no-such-product-999');
  await expect(page.getByRole('heading', { name: 'Товары не найдены' })).toBeVisible();
  await expect(page.getByTestId('results-summary')).toContainText('0 товаров найдено');
  await expect(page.getByText('Вы просмотрели все товары!')).toHaveCount(0);
  expect((await page.getByRole('button', { name: 'Сбросить все' }).boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button', { name: 'Сбросить все' }).click();
  await expect(page.getByTestId('results-summary')).toContainText('194 товаров найдено');
});

test('API loading, end, empty and retry are mutually exclusive', async ({ page }) => {
  let releaseFirst;
  const first = new Promise(resolve => { releaseFirst = resolve; });
  let fail = false;
  await page.route('https://dummyjson.com/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/categories') return route.fulfill({ json: [] });
    if (url.searchParams.get('q') === 'empty') return route.fulfill({ json: { products: [], total: 0, limit: 10, skip: 0 } });
    if (url.searchParams.get('q') === 'fail' && fail) { fail = false; return route.fulfill({ status: 503, body: 'Unavailable' }); }
    if (url.pathname === '/products' && !url.searchParams.get('q')) await first;
    return route.fulfill({ json: { products: [{ id: 1, title: 'API Item', category: 'beauty', price: 10, rating: 4, thumbnail: '' }], total: 1, limit: 10, skip: 0 } });
  });
  await page.goto('/products?source=api');
  await expect(page.getByRole('status', { name: 'Загрузка товаров...' })).toBeVisible();
  await expect(page.getByTestId('results-summary')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Товары не найдены' })).toHaveCount(0);
  releaseFirst();
  await expect(page.getByRole('heading', { name: 'API Item' })).toBeVisible();
  await expect(page.getByTestId('results-summary')).toContainText('1 товаров среди загруженных страниц');
  await expect(page.getByText('Вы просмотрели все товары!')).toBeVisible();
  await page.getByRole('textbox', { name: 'Поиск' }).fill('empty');
  await expect(page.getByRole('heading', { name: 'Товары не найдены' })).toBeVisible();
  await expect(page.getByText('Вы просмотрели все товары!')).toHaveCount(0);
  fail = true;
  await page.getByRole('textbox', { name: 'Поиск' }).fill('fail');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Товары не найдены' })).toHaveCount(0);
  await expect(page.getByText('Вы просмотрели все товары!')).toHaveCount(0);
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByRole('heading', { name: 'API Item' })).toBeVisible();
  await expect(page.getByText('Вы просмотрели все товары!')).toBeVisible();
});
