import { test, expect } from '@playwright/test';

test('gallery dots retain separate selected and focus states across themes', async ({ page }) => {
  await page.goto('/product/6');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => localStorage.setItem('theme', value), theme);
    await page.reload();
    const dots = page.locator('[class*="_carouselDots_"] button');
    const inactive = dots.nth(1);
    const active = dots.first();
    await expect(active).toHaveAttribute('aria-current', 'true');
    await expect(inactive).not.toHaveAttribute('aria-current', 'true');
    const colors = await dots.evaluateAll(elements => elements.slice(0, 2).map(element => ({
      dot: getComputedStyle(element).backgroundColor,
      mark: getComputedStyle(element, '::before').backgroundColor,
      ring: getComputedStyle(element, '::before').boxShadow,
      size: getComputedStyle(element, '::before').width,
    })));
    expect(colors[0].mark).not.toBe(colors[1].mark);
    expect(colors[1].dot).toBe('rgba(0, 0, 0, 0)');
    expect(colors[1].size).toBe('10px');
    expect(colors[1].mark).toBe(theme === 'dark' ? 'rgb(212, 208, 224)' : 'rgb(90, 84, 112)');
    expect(colors[1].ring).not.toBe('none');
    await inactive.focus();
    await expect(inactive).toHaveCSS('outline-style', 'solid');
    await expect(active).toHaveAttribute('aria-current', 'true');
    expect((await inactive.boundingBox()).width).toBeGreaterThanOrEqual(32);
  }
});

test('gallery dots sit below loaded and fallback images without changing the image slot', async ({ page }) => {
  const imageResponse = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="blue"/></svg>';
  await page.goto('/product/6');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => localStorage.setItem('theme', value), theme);
    for (const state of ['loaded', 'fallback']) {
      await page.unroute('https://cdn.dummyjson.com/**');
      await page.route('https://cdn.dummyjson.com/**', route => state === 'fallback'
        ? route.abort()
        : route.fulfill({ contentType: 'image/svg+xml', body: imageResponse }));
      for (const width of [320, 390, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto('/product/6');
        const slot = page.locator('[class*="_imageSlot_"][data-image-state]');
        await expect(slot).toHaveAttribute('data-image-state', state);
        const gallery = await page.locator('[class*="_productGallery_"]').boundingBox();
        const image = await slot.boundingBox();
        const dot = await page.locator('[class*="_carouselDots_"] button').first().boundingBox();
        expect(image.height).toBe(width <= 480 ? 218 : width <= 768 ? 268 : 368);
        expect(dot.y).toBeGreaterThanOrEqual(image.y + image.height);
        expect(dot.y + dot.height + 6).toBeLessThanOrEqual(gallery.y + gallery.height);
      }
    }
  }
});

test('gallery arrows keep 44px targets around smaller symmetric icons', async ({ page }) => {
  await page.goto('/product/6');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => localStorage.setItem('theme', value), theme);
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/product/6');
      const arrows = [
        page.getByRole('button', { name: 'Предыдущее изображение' }),
        page.getByRole('button', { name: 'Следующее изображение' }),
      ];
      const geometry = [];
      for (const arrow of arrows) {
        const button = await arrow.boundingBox();
        const icon = await arrow.locator('svg[aria-hidden="true"]').boundingBox();
        const discWidth = await arrow.evaluate(element => getComputedStyle(element, '::before').width);
        expect(button.width).toBeGreaterThanOrEqual(44);
        expect(button.height).toBeGreaterThanOrEqual(44);
        expect(discWidth).toBe('32px');
        expect(icon.width).toBe(18);
        expect(icon.height).toBe(18);
        expect(Math.abs(icon.x + icon.width / 2 - button.x - button.width / 2)).toBeLessThan(1);
        expect(Math.abs(icon.y + icon.height / 2 - button.y - button.height / 2)).toBeLessThan(1);
        geometry.push(button);
      }
      expect(geometry[0].y).toBe(geometry[1].y);
    }
  }
});

test('back control has an accessible label, decorative icon, and keeps browser history', async ({ page }) => {
  await page.goto('/products');
  await page.goto('/product/6');
  const back = page.getByRole('button', { name: 'Назад' });
  await expect(back.locator('svg[aria-hidden="true"]')).toHaveCount(1);
  await expect(back.locator('span')).toHaveText('Назад');
  await back.focus();
  await expect(back).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/products$/);
});

test('product controls fit the accepted viewport and navigation breakpoints', async ({ page }) => {
  for (const width of [320, 390, 768, 769, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/product/6');
    await expect(page.getByRole('button', { name: 'Назад' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const mobileNav = page.getByRole('navigation', { name: 'Основная навигация' });
    await expect(mobileNav).toBeVisible({ visible: width <= 768 });
  }
});
