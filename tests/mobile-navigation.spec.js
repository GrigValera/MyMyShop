import { test, expect } from '@playwright/test';

test('mobile primary routes, catalog CTA and history stay usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Основная навигация' });
  await expect(nav.getByRole('link', { name: 'Главная' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('Подборка товаров со скидкой из полного каталога')).toBeVisible();
  await page.getByRole('link', { name: 'Смотреть весь каталог' }).click();
  await expect(page).toHaveURL('/products');
  await expect(nav.getByRole('link', { name: 'Каталог' })).toHaveAttribute('aria-current', 'page');
  await page.locator('[class*="_productsGrid_"] a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL('/products');
  await page.getByRole('button', { name: 'В корзину' }).first().click();
  await expect(nav.getByRole('link', { name: 'Корзина' }).locator('[class*="_badge_"]')).toHaveText('1');
  await expect(nav.getByRole('link', { name: 'Корзина' })).toHaveAttribute('aria-describedby', 'mobile-cart-count');
  await nav.getByRole('link', { name: 'Корзина' }).click();
  await expect(page).toHaveURL('/cart');
  await expect(page.getByRole('dialog', { name: 'Корзина' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Корзина' })).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page).toHaveURL('/products');
  await nav.getByRole('link', { name: 'Профиль' }).click();
  await expect(page).toHaveURL('/profile');
  await expect(page.getByText('Демо', { exact: false }).first()).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Профиль' })).toHaveAttribute('aria-current', 'page');
  await page.goto('/missing-mobile-route');
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
});

test('navigation boundary, spacing and overflow', async ({ page }) => {
  for (const width of [320, 390, 400, 480, 767, 768, 769, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 640 });
    await page.goto('/cart');
    const nav = page.getByRole('navigation', { name: 'Основная навигация' });
    if (width <= 768) {
      await expect(nav).toBeVisible();
      const geometry = await page.evaluate(() => ({
        navTop: document.querySelector('nav[aria-label="Основная навигация"]').getBoundingClientRect().top,
        reservedSpace: parseFloat(getComputedStyle(document.querySelector('[class*="_layout_"]')).paddingBottom),
        docWidth: document.documentElement.scrollWidth,
      }));
      expect(geometry.reservedSpace).toBeGreaterThanOrEqual(64);
      expect(geometry.navTop).toBeGreaterThan(0);
      expect(geometry.docWidth).toBeLessThanOrEqual(width);
    } else {
      await expect(nav).toBeHidden();
      await expect(page.locator('nav[class*="_desktopNav_"]')).toBeVisible();
    }
  }
});

test('desktop quick cart remains available', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto('/products');
  await page.getByRole('button', { name: 'Корзина' }).click();
  const drawer = page.getByRole('dialog', { name: 'Корзина' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Закрыть' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
});

test('mobile labels, focus and chat clear the navigation in English dark mode', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 320 });
  await page.goto('/');
  await page.evaluate(() => { localStorage.setItem('language', 'en'); localStorage.setItem('theme', 'dark'); });
  await page.reload();
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  for (const label of ['Home', 'Catalog', 'Cart', 'Profile']) {
    await expect(nav.getByRole('link', { name: label })).toBeVisible();
  }
  await nav.getByRole('link', { name: 'Catalog' }).focus();
  await expect(nav.getByRole('link', { name: 'Catalog' })).toBeFocused();
  await expect(nav.getByRole('link', { name: 'Catalog' })).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/products');
  const chat = page.locator('[class*="_chatToggle_"]');
  const chatBox = await chat.boundingBox();
  const navBox = await nav.boundingBox();
  expect(chatBox.y + chatBox.height).toBeLessThanOrEqual(navBox.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('product actions remain clickable after Back below fixed mobile controls', async ({ page }) => {
  for (const [index, width] of [320, 390, 400, 480].entries()) {
    await page.setViewportSize({ width, height: 640 });
    await page.goto('/products');
    const product = page.locator('[class*="_productsGrid_"] a[href^="/product/"]').first();
    await product.click();
    await expect(page).toHaveURL(/\/product\//);
    await page.goBack();
    await expect(page).toHaveURL('/products');

    const button = page.getByRole('button', { name: 'В корзину' }).first();
    await expect(button).toBeVisible();
    await button.evaluate((element) => element.scrollIntoView({ block: 'end' }));
    const hitTest = await button.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      const nav = document.querySelector('nav[aria-label="Основная навигация"]');
      const chat = document.querySelector('[class*="_chatToggle_"]');
      return {
        buttonHit: element === target || element.contains(target),
        aboveNav: box.bottom <= nav.getBoundingClientRect().top,
        aboveChat: box.bottom <= chat.getBoundingClientRect().top,
      };
    });
    expect(hitTest).toEqual({ buttonHit: true, aboveNav: true, aboveChat: true });
    await button.click();
    await expect(page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Корзина' }).locator('[class*="_badge_"]')).toHaveText(String(index + 1));
  }
});

test('mobile PUSH starts at top while Back restores catalog scroll', async ({ page }) => {
  test.setTimeout(180_000);
  const top = () => page.evaluate(() => window.scrollY);
  for (const width of [320, 390, 400, 480]) {
    await page.setViewportSize({ width, height: 640 });
    await page.goto('/products');
    await expect(page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]').first()).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Основная навигация' });
    for (let cycle = 0; cycle < 2; cycle += 1) {
      await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }));
      await expect.poll(top).toBeGreaterThan(300);
      const catalogScroll = await top();

      await nav.getByRole('link', { name: 'Главная' }).click();
      await expect(page).toHaveURL('/');
      await expect.poll(top).toBeLessThanOrEqual(2);
      await nav.getByRole('link', { name: 'Каталог' }).click();
      await expect(page).toHaveURL('/products');
      await expect.poll(top).toBeLessThanOrEqual(2);

      await page.goBack();
      await expect(page).toHaveURL('/');
      await expect.poll(top).toBeLessThanOrEqual(2);
      await page.goBack();
      await expect(page).toHaveURL('/products');
      await expect.poll(top).toBeGreaterThanOrEqual(catalogScroll - 50);

      for (const { label, path } of [{ label: 'Корзина', path: '/cart' }, { label: 'Профиль', path: '/profile' }]) {
        await nav.getByRole('link', { name: label }).click();
        await expect(page).toHaveURL(path);
        await expect.poll(top).toBeLessThanOrEqual(2);
        await page.goBack();
        await expect(page).toHaveURL('/products');
        await expect.poll(top).toBeGreaterThanOrEqual(catalogScroll - 50);
      }
    }
  }
});
