import { test, expect } from '@playwright/test';

const surfaces = [
  { path: '/', card: '[class*="_productsGrid_"] > [class*="_productCard_"]' },
  { path: '/products', card: '[class*="_productsGrid_"] > [class*="_cardInner_"]' },
  { path: '/product/1', card: '[class*="_productInfo_"]' },
];

for (const { path, card } of surfaces) {
  test(`${path} keeps a persistent product quantity control`, async ({ page }) => {
    await page.goto(path);
    const action = page.locator(card).first();
    const title = path.startsWith('/product/')
      ? await page.getByRole('heading', { level: 1 }).textContent()
      : await action.getByRole('heading', { level: 3 }).textContent();
    const footer = action.locator('[class*="_productFooter_"]');
    const heightBefore = path.startsWith('/product/') ? null : (await footer.boundingBox()).height;
    await action.getByRole('button', { name: 'В корзину' }).click();
    const control = action.getByRole('group', { name: `Количество: ${title}` });
    await expect(control.getByText('В корзине')).toBeVisible();
    await expect(control.locator('[class*="_value_"]')).toHaveText('1');
    await expect(action.getByRole('status')).toHaveText(`${title} добавлен в корзину. В корзине: 1`);
    await expect(page.locator('header [class*="_badge_"]').first()).toHaveText('1');
    await expect(page).toHaveURL(path);
    if (heightBefore !== null) expect((await footer.boundingBox()).height).toBe(heightBefore);
    const minus = control.getByRole('button', { name: `Уменьшить количество: ${title}` });
    const plus = control.getByRole('button', { name: `Увеличить количество: ${title}` });
    const geometry = await control.evaluate(element => {
      const outer = element.getBoundingClientRect();
      const value = element.querySelector('[class*="_value_"]').getBoundingClientRect();
      const buttons = [...element.querySelectorAll('button')].map(button => {
        const bounds = button.getBoundingClientRect();
        const icon = button.querySelector('svg').getBoundingClientRect();
        return {
          left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom,
          width: bounds.width, height: bounds.height,
          iconCenter: icon.top + icon.height / 2,
          radius: getComputedStyle(button).borderRadius,
        };
      });
      return {
        left: outer.left, right: outer.right, top: outer.top, bottom: outer.bottom,
        overflow: getComputedStyle(element).overflow,
        valueCenter: value.top + value.height / 2,
        buttons,
      };
    });
    expect(geometry.overflow).toBe('hidden');
    for (const button of geometry.buttons) {
      expect(button.width).toBeGreaterThanOrEqual(44);
      expect(button.height).toBeGreaterThanOrEqual(44);
      expect(button.left).toBeGreaterThanOrEqual(geometry.left);
      expect(button.right).toBeLessThanOrEqual(geometry.right);
      expect(button.top).toBeGreaterThanOrEqual(geometry.top);
      expect(button.bottom).toBeLessThanOrEqual(geometry.bottom);
      expect(button.radius).not.toBe('0px');
      expect(Math.abs(button.iconCenter - geometry.valueCenter)).toBeLessThan(0.5);
    }
    for (const button of [minus, plus]) {
      await page.mouse.move(0, 0);
      const normal = await button.evaluate(element => getComputedStyle(element).backgroundColor);
      await button.hover();
      await expect.poll(() => button.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(normal);
      const hover = await button.evaluate(element => getComputedStyle(element).backgroundColor);
      await page.mouse.down();
      await expect.poll(() => button.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(hover);
      const pressed = await button.evaluate(element => getComputedStyle(element).backgroundColor);
      await page.mouse.move(0, 0);
      await page.mouse.up();
      expect(hover).not.toBe(normal);
      expect(pressed).not.toBe(hover);
    }
    await plus.focus();
    for (const [key, button] of [['Shift+Tab', minus], ['Tab', plus]]) {
      await page.keyboard.press(key);
      await expect(button).toBeFocused();
      expect(await button.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
    }
    await control.getByRole('button', { name: `Увеличить количество: ${title}` }).click();
    await expect(control.locator('[class*="_value_"]')).toHaveText('2');
    await expect(page.locator('header [class*="_badge_"]').first()).toHaveText('2');
    await control.getByRole('button', { name: `Уменьшить количество: ${title}` }).click();
    await expect(control.locator('[class*="_value_"]')).toHaveText('1');
    await control.getByRole('button', { name: `Уменьшить количество: ${title}` }).click();
    await expect(action.getByRole('button', { name: 'В корзину' })).toBeVisible();
    await expect(page.locator('header [class*="_badge_"]')).toHaveCount(0);
  });
}

test('one product stays in sync across Home, Catalog, PDP and cart', async ({ page }) => {
  await page.goto('/');
  const homeCard = page.locator('[class*="_productsGrid_"] > [class*="_productCard_"]').first();
  const title = await homeCard.getByRole('heading', { level: 3 }).textContent();
  const details = await homeCard.getByRole('link').first().getAttribute('href');
  await homeCard.getByRole('button', { name: 'В корзину' }).click();
  await page.goto('/products');
  await page.getByRole('textbox', { name: 'Поиск' }).fill(title);
  const catalogCard = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]').first();
  await expect(catalogCard.locator('[class*="_value_"]')).toHaveText('1');
  await catalogCard.getByRole('button', { name: `Увеличить количество: ${title}` }).click();
  await expect(catalogCard.locator('[class*="_value_"]')).toHaveText('2');
  await page.getByRole('button', { name: 'Корзина', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: `Увеличить количество: ${title}` }).first().click();
  await page.keyboard.press('Escape');
  await expect(catalogCard.locator('[class*="_value_"]')).toHaveText('3');
  await page.goto(details);
  await expect(page.locator('[class*="_productInfo_"]').getByRole('group', { name: `Количество: ${title}` }).locator('[class*="_value_"]')).toHaveText('3');
  await expect(page.getByRole('link', { name: 'Перейти в корзину' })).toBeVisible();
  await page.getByRole('link', { name: 'Перейти в корзину' }).click();
  await expect(page.locator('output')).toHaveText(['2', '1']);
  await page.getByRole('button', { name: `Увеличить количество: ${title}` }).first().click();
  await page.goBack();
  await expect(page.locator('[class*="_productInfo_"]').getByRole('group', { name: `Количество: ${title}` }).locator('[class*="_value_"]')).toHaveText('4');
  await page.reload();
  await expect(page.locator('[class*="_productInfo_"]').getByRole('group', { name: `Количество: ${title}` }).locator('[class*="_value_"]')).toHaveText('4');
  await expect(page.getByRole('status').filter({ hasText: title })).toHaveCount(0);
  const control = page.locator('[class*="_productInfo_"]').getByRole('group', { name: `Количество: ${title}` });
  for (let index = 0; index < 4; index += 1) {
    await control.getByRole('button', { name: `Уменьшить количество: ${title}` }).click();
  }
  await expect(page.getByRole('button', { name: 'В корзину' })).toBeVisible();
  await expect(page.locator('header [class*="_badge_"]')).toHaveCount(0);
});

test('rapid increments and keyboard focus preserve quantity and status', async ({ page }) => {
  await page.goto('/products');
  const card = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]').first();
  const title = await card.getByRole('heading', { level: 3 }).textContent();
  const add = card.getByRole('button', { name: 'В корзину' });
  await add.focus();
  await page.keyboard.press('Enter');
  const plus = card.getByRole('button', { name: `Увеличить количество: ${title}` });
  await expect(plus).toBeFocused();
  await plus.evaluate(button => { for (let i = 0; i < 4; i += 1) button.click(); });
  await expect(card.locator('[class*="_value_"]')).toHaveText('5');
  await expect(page.locator('header [class*="_badge_"]').first()).toHaveText('5');
  await expect(card.getByRole('status')).toHaveText(`${title} добавлен в корзину. В корзине: 5`);
  await card.getByRole('button', { name: `Уменьшить количество: ${title}` }).focus();
  await page.keyboard.press('Space');
  await expect(card.locator('[class*="_value_"]')).toHaveText('4');
});

test('product, drawer and cart quantity buttons share rounded hover and pressed states', async ({ page }) => {
  await page.goto('/products');
  const card = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]').first();
  const title = await card.getByRole('heading', { level: 3 }).textContent();
  await card.getByRole('button', { name: 'В корзину' }).click();
  const productPlus = card.getByRole('button', { name: `Увеличить количество: ${title}` });
  await productPlus.click();
  const inspect = async (button) => {
    await page.mouse.move(0, 0);
    const radius = await button.evaluate(element => getComputedStyle(element).borderRadius);
    await button.hover();
    const hover = await button.evaluate(element => getComputedStyle(element).backgroundColor);
    await page.mouse.down();
    const pressed = await button.evaluate(element => getComputedStyle(element).backgroundColor);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    return { radius, hover, pressed };
  };
  const productStyle = await inspect(productPlus);
  await page.getByRole('button', { name: 'Корзина', exact: true }).click();
  const drawerPlus = page.getByRole('dialog').getByRole('button', { name: `Увеличить количество: ${title}` });
  const drawerStyle = await inspect(drawerPlus);
  await page.keyboard.press('Escape');
  await page.goto('/cart');
  const cartPlus = page.getByRole('button', { name: `Увеличить количество: ${title}` });
  const cartStyle = await inspect(cartPlus);
  expect(productStyle.radius).toBe(drawerStyle.radius);
  expect(productStyle.hover).toBe(drawerStyle.hover);
  expect(productStyle.pressed).toBe(drawerStyle.pressed);
  expect(cartStyle).toEqual(drawerStyle);
});

test('quantity controls fit mobile and desktop widths in RU and EN', async ({ page }) => {
  test.setTimeout(90_000);
  for (const width of [320, 360, 375, 390, 393, 412, 430, 480, 768, 769, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/products');
    const card = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]').first();
    await card.getByRole('button', { name: 'В корзину' }).click();
    const control = card.getByRole('group', { name: /Количество:/ });
    await expect(control.getByText('В корзине')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px overflow`).toBeLessThanOrEqual(width);
    const bounds = await control.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    if (width <= 768) {
      const nav = await page.getByRole('navigation', { name: 'Основная навигация' }).boundingBox();
      if (bounds.y < nav.y) expect(bounds.y + bounds.height).toBeLessThanOrEqual(nav.y);
    }
    await page.evaluate(() => localStorage.removeItem('mymyshop.cart.v1'));
    await page.reload();
  }
  await page.evaluate(() => localStorage.setItem('language', 'en'));
  await page.reload();
  const card = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]').first();
  const title = await card.getByRole('heading', { level: 3 }).textContent();
  await card.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(card.getByRole('group', { name: `Quantity: ${title}` }).getByText('In cart')).toBeVisible();
  await expect(card.getByRole('status')).toHaveText(`${title} added to cart. In cart: 1`);
});
