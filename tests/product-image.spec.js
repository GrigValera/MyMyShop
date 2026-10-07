import { test, expect } from '@playwright/test';

const fitsViewport = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('a delayed catalog image keeps its slot and reveals the decoded image', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  let firstRequest = true;
  await page.route('https://cdn.dummyjson.com/**', async route => {
    if (!firstRequest) return route.abort();
    firstRequest = false;
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="blue"/></svg>',
    });
  });
  await page.goto('/products', { waitUntil: 'domcontentloaded' });
  const slot = page.locator('[class*="_productsGrid_"] [data-image-state]').first();
  await expect(slot).toHaveAttribute('data-image-state', 'loading');
  const before = await slot.boundingBox();
  await expect(slot).toHaveAttribute('data-image-state', 'loaded');
  const after = await slot.boundingBox();
  expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
  await expect(slot.locator('img')).toHaveCSS('opacity', '1');
  expect(await fitsViewport(page)).toBe(true);
});

test('blocked product CDN shows named fallbacks on Home, catalog, details and cart', async ({ page }) => {
  await page.route('https://cdn.dummyjson.com/**', route => route.abort());
  await page.setViewportSize({ width: 390, height: 900 });

  await page.goto('/');
  const homeSlot = page.locator('[class*="_productsGrid_"] [data-image-state]').first();
  await expect(homeSlot).toHaveAttribute('data-image-state', 'fallback');
  await expect(homeSlot.getByRole('img')).toHaveCount(0);
  await expect(homeSlot.locator('svg')).toBeVisible();
  expect(await fitsViewport(page)).toBe(true);

  await page.goto('/products');
  const card = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]').first();
  const catalogSlot = card.locator('[data-image-state]');
  await expect(catalogSlot).toHaveAttribute('data-image-state', 'fallback');
  await expect(catalogSlot.locator('img')).toHaveCount(0);
  await card.getByRole('button', { name: 'В корзину' }).click();

  await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Корзина' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const cartSlot = page.locator('[class*="_cartItemImage_"][data-image-state]').first();
  await expect(cartSlot).toHaveAttribute('data-image-state', 'fallback');
  expect((await cartSlot.boundingBox()).height).toBeGreaterThan(0);
  expect(await fitsViewport(page)).toBe(true);

  await page.goto('/product/1');
  const detailsSlot = page.locator('[class*="_imageSlot_"][data-image-state]');
  await expect(detailsSlot).toHaveAttribute('data-image-state', 'fallback');
  await expect(detailsSlot.getByRole('img')).toHaveCount(0);
  expect((await detailsSlot.boundingBox()).height).toBeGreaterThan(200);
  expect(await fitsViewport(page)).toBe(true);
});

test('Product Details gallery controls stay above the image and inside its slot', async ({ page }) => {
  const imageResponse = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="blue"/></svg>';

  for (const state of ['fallback', 'loaded']) {
    await page.unroute('https://cdn.dummyjson.com/**');
    await page.route('https://cdn.dummyjson.com/**', route => state === 'fallback'
      ? route.abort()
      : route.fulfill({ contentType: 'image/svg+xml', body: imageResponse }));

    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/product/6');
      const slot = page.locator('[class*="_imageSlot_"][data-image-state]');
      await expect(slot).toHaveAttribute('data-image-state', state);
      const controls = page.locator('[class*="_carouselBtn_"]');
      await expect(controls).toHaveCount(2);

      for (const control of await controls.all()) {
        await expect(control).toBeVisible();
        const geometry = await control.evaluate(button => {
          const slotRect = button.parentElement.querySelector('[data-image-state]').getBoundingClientRect();
          const buttonRect = button.getBoundingClientRect();
          const fallbackRect = button.parentElement.querySelector('[data-image-state] svg')?.getBoundingClientRect();
          const centerX = buttonRect.left + buttonRect.width / 2;
          const centerY = buttonRect.top + buttonRect.height / 2;
          return {
            inside: buttonRect.left >= slotRect.left - 1 && buttonRect.right <= slotRect.right + 1
              && buttonRect.top >= slotRect.top - 1 && buttonRect.bottom <= slotRect.bottom + 1,
            onTop: button.contains(document.elementFromPoint(centerX, centerY)),
            touchSize: buttonRect.width >= 44 && buttonRect.height >= 44,
            fallbackOverlap: fallbackRect && buttonRect.left < fallbackRect.right
              && buttonRect.right > fallbackRect.left && buttonRect.top < fallbackRect.bottom
              && buttonRect.bottom > fallbackRect.top,
          };
        });
        expect(geometry.inside, `${state} at ${width}px: arrow inside image slot`).toBe(true);
        expect(geometry.onTop, `${state} at ${width}px: arrow above image/fallback`).toBe(true);
        expect(geometry.touchSize, `${state} at ${width}px: arrow touch target`).toBe(true);
        expect(geometry.fallbackOverlap, `${state} at ${width}px: fallback clear of arrow`).toBeFalsy();
        await control.click();
      }

      await expect(slot).toHaveAttribute('data-image-state', state);
      await expect(slot.locator('svg')).toHaveCount(state === 'fallback' ? 1 : 0);
      expect(await fitsViewport(page), `${state} at ${width}px: no horizontal overflow`).toBe(true);
    }
  }
});
