import { test, expect } from '@playwright/test';

const widths = [320, 390, 480, 768, 1024, 1280, 1440];

test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.dummyjson.com/**', route => route.abort());
});

for (const width of widths) {
  test(`catalog layout stays within ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/products');

    const cards = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]');
    await expect(cards).toHaveCount(194);
    await expect(cards.first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Поиск' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Фильтры' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    const geometry = await page.locator('[class*="_productsGrid_"]').evaluate(grid => {
      const cards = [...grid.children];
      const first = cards[0].getBoundingClientRect();
      const last = cards.at(-1).getBoundingClientRect();
      const firstRow = cards.filter(card => Math.abs(card.getBoundingClientRect().top - first.top) < 1);
      return {
        columns: firstRow.length,
        sameHeight: firstRow.every(card => Math.abs(card.getBoundingClientRect().height - first.height) < 1),
        firstInside: first.left >= grid.getBoundingClientRect().left - 1,
        lastInside: last.right <= grid.getBoundingClientRect().right + 1,
      };
    });
    expect(geometry.columns).toBeGreaterThanOrEqual(1);
    expect(geometry.sameHeight).toBe(true);
    expect(geometry.firstInside).toBe(true);
    expect(geometry.lastInside).toBe(true);
  });
}

test('long title and failed image keep card geometry and controls usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/products');
  const cards = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]');
  await expect(cards).toHaveCount(194);
  await page.evaluate(() => document.fonts.ready);
  const first = cards.first();
  const initial = await first.boundingBox();
  const imageSlot = first.locator('[class*="_productImage_"]');
  const slotBefore = await imageSlot.boundingBox();

  await first.locator('h3').evaluate(title => { title.textContent = 'Очень длинное название товара '.repeat(20); });
  await expect(imageSlot).toHaveAttribute('data-image-state', 'fallback');
  await expect(imageSlot.locator('img')).toHaveCount(0);

  const after = await first.boundingBox();
  const slotAfter = await imageSlot.boundingBox();
  expect(Math.abs(after.height - initial.height)).toBeLessThanOrEqual(2);
  expect(slotAfter.height).toBe(slotBefore.height);
  await expect(first.getByRole('button', { name: 'В корзину' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('catalog controls remain reachable on mobile and desktop', async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/products');
    await page.getByRole('button', { name: 'Фильтры' }).click();
    await expect(page.getByRole('button', { name: 'Закрыть' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Применить' })).toBeVisible();
    await page.getByRole('button', { name: 'Закрыть' }).click();
    await expect(page.getByRole('button', { name: 'Закрыть' })).toBeHidden();
    await expect(page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]').first().getByRole('button', { name: 'В корзину' })).toBeVisible();
  }
});

test('sale cards share the responsive grid contract', async ({ page }) => {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const grid = page.locator('[class*="_productsGrid_"]');
    await expect(grid).toBeVisible();
    await expect(grid.getByRole('link').first()).toBeVisible();
    await expect(grid.getByRole('button', { name: 'В корзину' }).first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('opening a product from a scrolled catalog starts at the product top', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/products');
  const cards = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]');
  await expect(cards).toHaveCount(194);
  await page.evaluate(() => window.scrollTo({ top: 2400, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

  const card = cards.nth(12);
  await card.getByRole('link').click();
  await expect(page).toHaveURL(/\/product\/\d+/);
  const mainImage = page.getByRole('img', { name: / - 1$/ });
  await expect(mainImage).toBeVisible();
  await expect(mainImage.locator('svg')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(5);
  const bounds = await mainImage.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeLessThan(700);
});
