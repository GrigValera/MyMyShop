import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.dummyjson.com/**', route => route.abort());
});

const search = page => page.getByRole('textbox', { name: 'Поиск' });
const summary = page => page.getByTestId('results-summary');
const filters = page => page.getByRole('button', { name: 'Фильтры' });
const dialog = page => page.getByRole('dialog', { name: 'Фильтры' });

test('direct default and search links reproduce their result state', async ({ page }) => {
  await page.goto('/products');
  await expect(summary(page)).toContainText('194 товаров найдено');
  await expect(search(page)).toHaveValue('');
  await page.goto('/products?q=red');
  await expect(search(page)).toHaveValue('red');
  await expect(summary(page)).toContainText('18 товаров найдено');
  await page.reload();
  await expect(search(page)).toHaveValue('red');
  await expect(summary(page)).toContainText('18 товаров найдено');
});

test('multiple categories, price, sort and combined deep links are reproducible', async ({ page }) => {
  await page.goto('/products?category=fragrances&category=beauty');
  await expect(page).toHaveURL('/products?category=beauty&category=fragrances');
  await expect(summary(page)).toContainText('10 товаров найдено');
  await filters(page).click();
  await expect(dialog(page).getByRole('button', { name: 'Beauty' })).toHaveAttribute('aria-pressed', 'true');
  await expect(dialog(page).getByRole('button', { name: 'Fragrances' })).toHaveAttribute('aria-pressed', 'true');
  await dialog(page).getByRole('button', { name: 'Применить' }).click();

  await page.goto('/products?minPrice=10&maxPrice=100&sort=desc');
  await filters(page).click();
  await expect(dialog(page).getByRole('spinbutton', { name: 'Цена от' })).toHaveValue('10');
  await expect(dialog(page).getByRole('spinbutton', { name: 'Цена до' })).toHaveValue('100');
  await expect(dialog(page).getByRole('radio', { name: 'Цена: по убыванию' })).toBeChecked();
  await dialog(page).getByRole('button', { name: 'Применить' }).click();

  await page.goto('/products?sort=asc&category=beauty&q=red&maxPrice=100&minPrice=10');
  await expect(page).toHaveURL('/products?q=red&category=beauty&minPrice=10&maxPrice=100&sort=asc');
  await expect(search(page)).toHaveValue('red');
  await expect(summary(page)).toContainText('1 товаров найдено');
  await expect(page.getByRole('heading', { name: 'Red Lipstick' })).toBeVisible();
});

test('configured catalog and search survive PDP Back', async ({ page }) => {
  await page.goto('/products?category=beauty&sort=asc');
  await expect(summary(page)).toContainText('5 товаров найдено');
  await page.getByRole('link', { name: /Essence Mascara Lash Princess/ }).click();
  await page.goBack();
  await expect(page).toHaveURL('/products?category=beauty&sort=asc');
  await expect(summary(page)).toContainText('5 товаров найдено');

  await page.goto('/products?q=red&category=beauty');
  await page.getByRole('link', { name: /Red Lipstick/ }).click();
  await page.goBack();
  await expect(page).toHaveURL('/products?q=red&category=beauty');
  await expect(search(page)).toHaveValue('red');
  await expect(summary(page)).toContainText('2 товаров найдено');
});

test('Back and Forward restore search, category and sort transitions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Смотреть весь каталог' }).click();
  await search(page).fill('red');
  await expect(page).toHaveURL('/products?q=red');
  await filters(page).click();
  await dialog(page).getByRole('button', { name: 'Beauty' }).click();
  await dialog(page).getByRole('radio', { name: 'Цена: по возрастанию' }).check();
  await dialog(page).getByRole('button', { name: 'Применить' }).click();
  await expect(page).toHaveURL('/products?q=red&category=beauty&sort=asc');
  await page.goBack();
  await expect(page).toHaveURL('/products?q=red&category=beauty');
  await expect(summary(page)).toContainText('2 товаров найдено');
  await page.goBack();
  await expect(page).toHaveURL('/products?q=red');
  await expect(search(page)).toHaveValue('red');
  await page.goBack();
  await expect(page).toHaveURL('/products');
  await expect(search(page)).toHaveValue('');
  await page.goForward();
  await expect(page).toHaveURL('/products?q=red');
  await expect(search(page)).toHaveValue('red');
  await page.goForward();
  await expect(page).toHaveURL('/products?q=red&category=beauty');
  await page.goForward();
  await expect(page).toHaveURL('/products?q=red&category=beauty&sort=asc');
});

test('Reset clears catalog state but keeps source compatibility', async ({ page }) => {
  await page.goto('/products?q=red&category=beauty&minPrice=10&sort=desc');
  await page.getByTestId('active-filters').getByRole('button', { name: 'Сбросить все' }).click();
  await expect(page).toHaveURL('/products');
  await expect(search(page)).toHaveValue('');
  await expect(summary(page)).toContainText('194 товаров найдено');
  await page.goto('/products?q=red&source=api');
  await filters(page).click();
  await dialog(page).getByRole('button', { name: 'Сбросить все' }).click();
  await expect(page).toHaveURL('/products?source=api');
});

test('invalid, duplicate and unknown parameters canonicalize safely', async ({ page }) => {
  await page.goto('/products?category=unknown&category=beauty&category=beauty&q=&minPrice=-2&maxPrice=bad&sort=random&extra=1');
  await expect(page).toHaveURL('/products?category=beauty');
  await expect(summary(page)).toContainText('5 товаров найдено');
  await page.goto('/products?q=%20red%20&q=blue&minPrice=10&minPrice=20&sort=asc&sort=desc');
  await expect(page).toHaveURL('/products?q=red&minPrice=10&sort=asc');
  await expect(search(page)).toHaveValue('red');
  await page.goto('/products?minPrice=100&maxPrice=10');
  await expect(page).toHaveURL('/products?minPrice=100&maxPrice=10');
  await expect(summary(page)).toContainText('0 товаров найдено');
  await page.goto('/products?q=%E0%A4%A');
  await expect(page.getByRole('heading', { name: 'Товары', exact: true })).toBeVisible();
});

test('Unicode and 120-character query limit apply to URLs and input', async ({ page }) => {
  await page.goto('/products?q=%D0%BA%D1%80%D0%B5%D0%BC');
  await expect(search(page)).toHaveValue('крем');
  const longQuery = 'a'.repeat(140);
  await page.goto('/products?q=' + longQuery);
  await expect(search(page)).toHaveValue('a'.repeat(120));
  await expect(page).toHaveURL('/products?q=' + 'a'.repeat(120));
  await page.goto('/products');
  await search(page).fill(longQuery);
  await expect(search(page)).toHaveValue('a'.repeat(120));
  await expect(page).toHaveURL('/products?q=' + 'a'.repeat(120));
});

test('mobile Apply, Reset and 768 to 769 keep the URL state and close the dialog', async ({ page }) => {
  for (const width of [320, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/products?category=beauty');
    await filters(page).click();
    await expect(dialog(page).getByRole('button', { name: 'Beauty' })).toHaveAttribute('aria-pressed', 'true');
    await dialog(page).getByRole('radio', { name: 'Цена: по возрастанию' }).click();
    await expect(dialog(page).getByRole('radio', { name: 'Цена: по возрастанию' })).toBeChecked();
    await dialog(page).getByRole('button', { name: 'Применить' }).click();
    await expect(page).toHaveURL('/products?category=beauty&sort=asc');
    await filters(page).click();
    await dialog(page).getByRole('button', { name: 'Сбросить все' }).click();
    await expect(page).toHaveURL('/products');
    await dialog(page).getByRole('button', { name: 'Применить' }).click();
  }
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/products?category=beauty');
  await filters(page).click();
  await page.setViewportSize({ width: 769, height: 900 });
  await expect(dialog(page)).toHaveCount(0);
  await expect(page).toHaveURL('/products?category=beauty');
});

test('pending search cannot overwrite browser navigation or PDP state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Смотреть весь каталог' }).click();
  await search(page).fill('red');
  await page.goBack();
  await expect(page).toHaveURL('/');
  await page.goForward();
  await expect(page).toHaveURL('/products');
  await expect(search(page)).toHaveValue('');
  await search(page).fill('red');
  await expect(page).toHaveURL('/products?q=red');
  await search(page).fill('blue');
  await page.goBack();
  await expect(page).toHaveURL('/products');
  await expect(search(page)).toHaveValue('');
});

test('URL updates keep focus and PDP Back restores the catalog scroll position', async ({ page }) => {
  await page.goto('/products');
  await search(page).focus();
  await search(page).fill('red');
  await expect(page).toHaveURL('/products?q=red');
  await expect(search(page)).toBeFocused();
  const product = page.locator('a[href^="/product/"]').nth(10);
  await product.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(0);
  await product.click();
  await page.goBack();
  await expect(page).toHaveURL('/products?q=red');
  await expect(summary(page)).toContainText('18 товаров найдено');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
});
