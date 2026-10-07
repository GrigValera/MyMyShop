import { test, expect } from '@playwright/test';

test('gallery keeps pointer state transient and keyboard focus visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/product/6');
  const next = page.getByRole('button', { name: 'Следующее изображение' });
  await expect(next).toBeVisible();
  await next.click();
  await page.mouse.move(0, 0);
  await expect(next).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0.85)');
  await page.keyboard.press('Tab');
  await next.focus();
  await expect(next).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.locator('[class*="_carouselDots_"] button[aria-current="true"]')).toHaveCount(1);
  const firstDot = page.getByRole('button', { name: 'Показать изображение 1' });
  await expect(firstDot).toBeVisible();
  expect((await firstDot.boundingBox()).width).toBeGreaterThanOrEqual(24);
});

test('single-image product has no inactive carousel controls', async ({ page }) => {
  await page.goto('/product/1');
  await expect(page.locator('[class*="_imageSlot_"]')).toBeVisible();
  await expect(page.locator('[class*="_carouselBtn_"]')).toHaveCount(0);
});

test('filter selection is distinct from keyboard focus', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: 'Фильтры' }).click();
  const category = page.getByRole('button', { name: 'Beauty' });
  await category.click();
  await expect(category).toHaveAttribute('aria-pressed', 'true');
  await expect(category).toHaveCSS('outline-style', 'none');
  const sort = page.getByRole('radio', { name: 'Цена: по возрастанию' });
  await sort.check();
  await expect(sort).toBeChecked();
  await expect(sort.locator('..')).toHaveCSS('outline-style', 'none');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus-visible')).toHaveCount(1);
});

test('visible mobile icons and shared buttons keep usable geometry', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Основная навигация' });
  const cart = nav.getByRole('link', { name: 'Корзина' });
  const box = await cart.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  const icon = cart.locator('svg');
  await expect(icon).toHaveCSS('width', '24px');
  await expect(icon).toHaveCSS('stroke-width', '1.8px');
  await expect(nav.getByRole('link', { name: 'Главная' })).toHaveAttribute('aria-current', 'page');
  const cta = page.getByRole('link', { name: 'Смотреть весь каталог' });
  expect((await cta.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.goto('/products');
  const button = page.getByRole('button', { name: 'В корзину' }).first();
  const alignment = await button.evaluate(element => {
    const style = getComputedStyle(element);
    return { display: style.display, align: style.alignItems, justify: style.justifyContent };
  });
  expect(['flex', 'inline-flex']).toContain(alignment.display);
  expect(alignment.align).toBe('center');
  expect(alignment.justify).toBe('center');
  expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
