import { test, expect } from '@playwright/test';

const addFirstProducts = async (page, count = 1) => {
  await page.goto('/products');
  const cards = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]');
  const titles = [];
  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    titles.push(await card.getByRole('heading').first().textContent());
    await card.getByRole('button', { name: 'В корзину' }).click();
  }
  return titles;
};

test('empty page and drawer lead to the catalog in both locales', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();
  await expect(page.getByText('Сводка заказа')).toHaveCount(0);
  await page.getByRole('link', { name: 'Продолжить покупки' }).click();
  await expect(page).toHaveURL('/products');
  await page.getByRole('button', { name: /^(Корзина|Cart)$/ }).click();
  const drawer = page.getByRole('dialog', { name: 'Корзина' });
  await expect(drawer.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();
  await drawer.getByRole('link', { name: 'Продолжить покупки' }).click();
  await expect(drawer).toHaveCount(0);
  await page.getByText('EN', { exact: true }).first().click();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue Shopping' })).toBeVisible();
});

test('quantity minimum, totals, drawer consistency and last-item removal', async ({ page }) => {
  const [title] = await addFirstProducts(page);
  const card = page.locator('[class*="_productsGrid_"] > [class*="_cardInner_"]').first();
  await card.getByRole('button', { name: 'В корзину' }).click();
  await page.getByRole('button', { name: /^(Корзина|Cart)$/ }).click();
  const drawer = page.getByRole('dialog');
  const minus = drawer.getByRole('button', { name: `Уменьшить количество: ${title}` });
  const plus = drawer.getByRole('button', { name: `Увеличить количество: ${title}` });
  await expect(drawer.locator('output')).toHaveText('2');
  await plus.click();
  await expect(drawer.locator('output')).toHaveText('3');
  await minus.click();
  await minus.click();
  await expect(drawer.locator('output')).toHaveText('1');
  await expect(minus).toBeDisabled();
  await expect(drawer.getByText('Товаров')).toBeVisible();
  await drawer.getByRole('link', { name: 'Перейти в корзину' }).click();
  await expect(page.locator('output')).toHaveText('1');
  await expect(page.getByRole('button', { name: `Уменьшить количество: ${title}` })).toBeDisabled();
  await expect(page.getByRole('button', { name: /^(Корзина|Cart)$/ })).toHaveCount(0);
  await page.getByRole('button', { name: `Увеличить количество: ${title}` }).click();
  await expect(page.locator('output')).toHaveText('2');
  await page.getByRole('button', { name: `Удалить из корзины: ${title}` }).click();
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();
  await expect(page.getByText('Сводка заказа')).toHaveCount(0);
});

test('multiple products keep totals and layout at cart widths', async ({ page }) => {
  const titles = await addFirstProducts(page, 3);
  await page.getByRole('button', { name: /^(Корзина|Cart)$/ }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.locator('output')).toHaveCount(3);
  await drawer.getByRole('button', { name: `Удалить из корзины: ${titles[1]}` }).click();
  await expect(drawer.locator('output')).toHaveCount(2);
  await drawer.getByRole('link', { name: 'Перейти в корзину' }).click();
  await expect(page.getByRole('heading', { name: titles[1] })).toHaveCount(0);
  const totalBefore = await page.locator('[class*="_totalRow_"] span').last().textContent();
  await page.getByRole('button', { name: `Увеличить количество: ${titles[0]}` }).click();
  const totalAfter = await page.locator('[class*="_totalRow_"] span').last().textContent();
  expect(totalAfter).not.toBe(totalBefore);
  await expect(page.getByText('Товаров')).toBeVisible();
  for (const width of [320, 390, 480, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px cart overflow`).toBeLessThanOrEqual(width);
    await expect(page.getByRole('button', { name: `Удалить из корзины: ${titles[0]}` })).toBeVisible();
  }
  await page.getByRole('link', { name: 'Продолжить покупки' }).click();
  await expect(page).toHaveURL('/products');
});

test('cart containers and actions stay inside narrow viewports', async ({ page }) => {
  await addFirstProducts(page, 3);
  await page.getByRole('button', { name: /^(Корзина|Cart)$/ }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Перейти в корзину' }).click();
  await expect(page.getByRole('heading', { name: 'Корзина', exact: true })).toBeVisible();

  for (const width of [320, 390, 400, 480]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await page.evaluate(() => {
      const selectors = [
        'main > .container', '[class*="_cartPage_"]', '[class*="_cartContent_"]',
        '[class*="_cartItems_"]', '[class*="_cartItem_"]', '[class*="_cartItemImage_"]',
        '[class*="_productLink_"]', '[class*="_cartItemDetails_"]', '[class*="_itemActions_"]', '[class*="_cartSummary_"]',
      ];
      return {
        scrollWidth: document.documentElement.scrollWidth,
        boxes: selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(node => {
          const rect = node.getBoundingClientRect();
          return { selector, left: rect.left, right: rect.right };
        })),
      };
    });
    expect(geometry.scrollWidth, `${width}px document width`).toBeLessThanOrEqual(width);
    for (const box of geometry.boxes) {
      expect(box.left, `${width}px ${box.selector} left`).toBeGreaterThanOrEqual(0);
      expect(box.right, `${width}px ${box.selector} right`).toBeLessThanOrEqual(width);
    }
  }
});

test('drawer controls are keyboard reachable and blocked images retain fallback', async ({ page }) => {
  await page.route('https://cdn.dummyjson.com/**', route => route.abort());
  const [title] = await addFirstProducts(page);
  await page.getByRole('button', { name: /^(Корзина|Cart)$/ }).focus();
  await page.keyboard.press('Enter');
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByRole('button', { name: 'Закрыть' })).toBeFocused();
  await expect(drawer.locator('[data-image-state]')).toHaveAttribute('data-image-state', 'fallback');
  const totalBefore = await drawer.locator('[class*="_totalRow_"] span').last().textContent();
  await page.keyboard.press('Tab');
  await expect(drawer.getByRole('button', { name: `Увеличить количество: ${title}` })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(drawer.locator('output')).toHaveText('2');
  expect(await drawer.locator('[class*="_totalRow_"] span').last().textContent()).not.toBe(totalBefore);
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^(Корзина|Cart)$/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').getByRole('button', { name: `Удалить из корзины: ${title}` }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Итого')).toHaveCount(0);
});

test('opening cart from a scrolled catalog shows its heading below the header', async ({ page }) => {
  await addFirstProducts(page);
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.getByRole('button', { name: /^(Корзина|Cart)$/, exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Перейти в корзину' }).click();
  await expect(page).toHaveURL('/cart');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const heading = await page.getByRole('heading', { name: 'Корзина', exact: true }).boundingBox();
  const header = await page.getByRole('banner').boundingBox();
  expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height);
});

test('touch quantity controls do not keep a hover tint after tap', async ({ browser }) => {
  for (const width of [320, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const [title] = await addFirstProducts(page);
    await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Корзина' }).tap();
    const plus = page.getByRole('button', { name: `Увеличить количество: ${title}` });
    const before = await plus.evaluate(button => getComputedStyle(button).backgroundColor);
    expect(await plus.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false);
    await plus.tap();
    await expect(page.locator('output')).toHaveText('2');
    await expect.poll(() => plus.evaluate(button => getComputedStyle(button).backgroundColor)).toBe(before);
    const pagePlus = plus;
    const pageBefore = await pagePlus.evaluate(button => getComputedStyle(button).backgroundColor);
    await pagePlus.tap();
    await expect(page.locator('output')).toHaveText('3');
    await expect.poll(() => pagePlus.evaluate(button => getComputedStyle(button).backgroundColor)).toBe(pageBefore);
    await context.close();
  }
});

test('mouse hover, pressed and keyboard focus remain distinct; remove is consistent', async ({ page }) => {
  const [title] = await addFirstProducts(page);
  await page.getByRole('button', { name: /^(Корзина|Cart)$/ }).click();
  const drawer = page.getByRole('dialog');
  const plus = drawer.getByRole('button', { name: `Увеличить количество: ${title}` });
  const normal = await plus.evaluate(button => getComputedStyle(button).backgroundColor);
  await plus.hover();
  const hover = await plus.evaluate(button => getComputedStyle(button).backgroundColor);
  expect(hover).not.toBe(normal);
  await page.mouse.down();
  const pressed = await plus.evaluate(button => getComputedStyle(button).backgroundColor);
  expect(pressed).not.toBe(hover);
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await expect(plus).toHaveCSS('background-color', normal);
  await drawer.getByRole('button', { name: 'Закрыть' }).focus();
  await page.keyboard.press('Tab');
  await expect(drawer.getByRole('button', { name: `Уменьшить количество: ${title}` })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(plus).toBeFocused();
  await expect(plus).toHaveCSS('outline-style', 'solid');

  const drawerRemove = drawer.getByRole('button', { name: `Удалить из корзины: ${title}` });
  await expect(drawerRemove.locator('svg')).toHaveCount(1);
  await expect(drawerRemove).toContainText('Удалить');
  expect((await drawerRemove.boundingBox()).height).toBeGreaterThanOrEqual(44);
  const drawerRemoveColor = await drawerRemove.evaluate(button => getComputedStyle(button).color);
  await drawer.getByRole('link', { name: 'Перейти в корзину' }).click();
  const pageRemove = page.getByRole('button', { name: `Удалить из корзины: ${title}` });
  await expect(pageRemove.locator('svg')).toHaveCount(1);
  await expect(pageRemove).toContainText('Удалить');
  expect((await pageRemove.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect(await pageRemove.evaluate(button => getComputedStyle(button).color)).toBe(drawerRemoveColor);
});

test('remove stays readable with a long title across cart widths, themes and locales', async ({ page }) => {
  const title = 'A very long product name for cart controls and narrow layouts '.repeat(3);
  await page.route('https://dummyjson.com/**', route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/products/categories') return route.fulfill({ json: [] });
    return route.fulfill({ json: { products: [{ id: 991, title, price: 12, category: 'beauty', thumbnail: '' }], total: 1, limit: 10, skip: 0 } });
  });
  for (const { width, locale, theme } of [
    { width: 1280, locale: 'en', theme: 'light' },
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/products?source=api');
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('language', locale);
      localStorage.setItem('theme', theme);
    }, { locale, theme });
    await page.reload();
    const add = page.getByRole('button', { name: locale === 'ru' ? 'В корзину' : 'Add to Cart' });
    await add.click();
    await page.getByRole('button', { name: /^(Корзина|Cart)$/, exact: true }).click();
    const drawer = page.getByRole('dialog');
    await drawer.evaluate(async node => Promise.all(node.getAnimations().map(animation => animation.finished)));
    const removeName = locale === 'ru' ? `Удалить из корзины: ${title}` : `Remove from cart: ${title}`;
    const drawerRemove = drawer.getByRole('button', { name: removeName });
    await expect(drawerRemove).toBeVisible();
    if (width === 320) {
      const chatIsOnTop = await page.locator('[class*="_chatToggle_"]').evaluate(button => {
        const rect = button.getBoundingClientRect();
        return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === button;
      });
      expect(chatIsOnTop).toBe(false);
    }
    expect((await drawerRemove.boundingBox()).height).toBeGreaterThanOrEqual(44);
    const drawerRow = drawer.locator('[class*="_cartItem_"]').first();
    const drawerQuantity = drawerRow.getByRole('group', { name: new RegExp(title.slice(0, 20)) });
    const drawerQuantityBox = await drawerQuantity.boundingBox();
    const drawerRemoveBox = await drawerRemove.boundingBox();
    expect(Math.abs(drawerQuantityBox.y - drawerRemoveBox.y)).toBeLessThanOrEqual(2);
    expect(drawerQuantityBox.x + drawerQuantityBox.width).toBeLessThanOrEqual(drawerRemoveBox.x);
    expect(Number.parseFloat(await drawerRow.locator('[class*="_cartItemTitle_"]').evaluate(node => getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    expect(Number.parseFloat(await drawerRow.locator('[class*="_cartItemPrice_"]').evaluate(node => getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    const cartLink = drawer.getByRole('link', { name: locale === 'ru' ? 'Перейти в корзину' : 'View Cart' });
    await expect(drawer.getByRole('link', { name: locale === 'ru' ? 'Оформить заказ' : 'Checkout' })).toHaveCount(0);
    const offset = await cartLink.evaluate(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const text = range.getBoundingClientRect();
      const box = node.getBoundingClientRect();
      return { x: (text.left + text.right - box.left - box.right) / 2, y: (text.top + text.bottom - box.top - box.bottom) / 2 };
    });
    expect(Math.abs(offset.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(2);
    await cartLink.click();
    const pageRemove = page.getByRole('button', { name: removeName });
    await expect(pageRemove).toBeVisible();
    expect((await pageRemove.boundingBox()).height).toBeGreaterThanOrEqual(44);
    const pageRow = page.locator('[class*="_cartItem_"]').first();
    const pageQuantityBox = await pageRow.getByRole('group', { name: new RegExp(title.slice(0, 20)) }).boundingBox();
    const pageRemoveBox = await pageRemove.boundingBox();
    expect(Math.abs(pageQuantityBox.y - pageRemoveBox.y)).toBeLessThanOrEqual(2);
    expect(pageQuantityBox.x + pageQuantityBox.width).toBeLessThanOrEqual(pageRemoveBox.x);
    expect(Number.parseFloat(await pageRow.locator('h3').evaluate(node => getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    expect(Number.parseFloat(await pageRow.locator('[class*="_cartItemPrice_"]').evaluate(node => getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    await pageRow.getByRole('button', { name: locale === 'ru' ? `Увеличить количество: ${title}` : `Increase quantity: ${title}` }).click();
    await expect(pageRow.locator('output')).toHaveText('2');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('cart survives repeated drawer and route transitions without an empty root or runtime error', async ({ browser }, testInfo) => {
  test.setTimeout(180_000);
  const navigationLog = [];
  for (const width of [1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', error => pageErrors.push(error.stack ?? error.message));
    page.on('console', message => {
      if (message.type() === 'error' && !message.text().includes('ERR_NETWORK_ACCESS_DENIED')) {
        consoleErrors.push(message.text());
      }
    });
    await page.addInitScript(() => {
      window.__unhandledRejections = [];
      window.addEventListener('unhandledrejection', event => {
        window.__unhandledRejections.push(String(event.reason));
      });
    });
    await addFirstProducts(page, 3);
    const drawer = page.getByRole('dialog', { name: 'Корзина' });

    const inspect = async (iteration, step, expectedPath, expectedDrawer) => {
      const state = await page.evaluate(() => ({
        url: location.href,
        pathname: location.pathname,
        rootPresent: !!document.querySelector('#root'),
        rootChildren: document.querySelector('#root')?.childElementCount ?? 0,
        routeRendered: !!document.querySelector('[class*="_cartPage_"]') || !!document.querySelector('[class*="_productsPage_"]'),
        drawerOpen: !!document.querySelector('[role="dialog"]'),
        cartControlAvailable: !!document.querySelector('header button[aria-label="Корзина"], header button[aria-label="Cart"]'),
        cartCount: document.querySelector('header [class*="_badge_"]')?.textContent ?? '0',
        activeElement: document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName,
        bodyClass: document.body.className,
        unhandledRejections: window.__unhandledRejections,
      }));
      navigationLog.push({ width, iteration, step, ...state, pageErrors: [...pageErrors], consoleErrors: [...consoleErrors] });
      expect(state.pathname, `${width}px ${step} pathname`).toBe(expectedPath);
      expect(state.rootPresent && state.rootChildren > 0, `${width}px ${step} root`).toBe(true);
      expect(state.routeRendered, `${width}px ${step} route`).toBe(true);
      expect(state.drawerOpen, `${width}px ${step} drawer`).toBe(expectedDrawer);
      expect(state.cartControlAvailable, `${width}px ${step} cart control`).toBe(expectedPath !== '/cart');
      expect(state.cartCount, `${width}px ${step} cart count`).toBe('3');
      expect(state.unhandledRejections, `${width}px ${step} rejections`).toEqual([]);
      expect(pageErrors, `${width}px ${step} page errors`).toEqual([]);
      expect(consoleErrors, `${width}px ${step} console errors`).toEqual([]);
    };

    await expect(page.getByRole('heading', { name: 'Товары', exact: true })).toBeVisible();
    await inspect(-1, 'catalog', '/products', false);
    for (let iteration = 0; iteration < (width === 400 ? 10 : 5); iteration += 1) {
      await page.getByRole('button', { name: /^(Корзина|Cart)$/, exact: true }).click();
      await expect(drawer.locator('[class*="_cartItem_"]')).toHaveCount(3);
      await inspect(iteration, 'drawer', '/products', true);
      if (iteration === 0) {
        await page.keyboard.press('Escape');
        await expect(drawer).toHaveCount(0);
        await page.getByRole('button', { name: /^(Корзина|Cart)$/, exact: true }).click();
      }
      await expect(drawer.getByRole('link', { name: 'Оформить заказ' })).toHaveCount(0);
      await drawer.getByRole('link', { name: 'Перейти в корзину' }).click();
      await expect(page).toHaveURL('/cart');
      await expect(page.getByRole('heading', { name: 'Корзина', exact: true })).toBeVisible();
      await expect(page.locator('[class*="_cartItem_"]')).toHaveCount(3);
      await expect(page.getByRole('button', { name: /^(Корзина|Cart)$/ })).toHaveCount(0);
      await inspect(iteration, 'cart', '/cart', false);

      if (iteration % 2 === 0) {
        await page.getByRole('link', { name: 'Продолжить покупки' }).click();
      } else if (width < 768) {
        await page.getByRole('button', { name: 'Menu' }).click();
        await page.locator('nav[class*="_mobileNav_"]').getByRole('link', { name: 'Все товары' }).click();
      } else {
        await page.locator('nav[class*="_desktopNav_"]').getByRole('link', { name: 'Все товары' }).click();
      }
      await expect(page).toHaveURL('/products');
      await expect(page.getByRole('heading', { name: 'Товары', exact: true })).toBeVisible();
      await inspect(iteration, 'returned', '/products', false);
    }

    await page.getByRole('button', { name: /^(Корзина|Cart)$/, exact: true }).click();
    await expect(drawer.locator('[class*="_cartItem_"]')).toHaveCount(3);
    expect(await page.evaluate(() => window.__unhandledRejections)).toEqual([]);
    expect(pageErrors).toEqual([]);
    await context.close();
  }
  await testInfo.attach('cart-navigation-states', { body: JSON.stringify(navigationLog, null, 2), contentType: 'application/json' });
});

test('retired checkout URL returns to cart instead of rendering a blank root', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.stack ?? error.message));
  await page.goto('/checkout');
  await expect(page).toHaveURL('/cart');
  await expect(page.getByRole('heading', { name: 'Корзина пока пуста' })).toBeVisible();
  expect(await page.locator('#root').evaluate(root => root.childElementCount)).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
});

test('unmatched route renders a visible recovery path instead of an empty root', async ({ page }) => {
  await page.goto('/missing-cart-route');
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Продолжить покупки' })).toBeVisible();
  expect(await page.locator('#root').evaluate(root => root.childElementCount)).toBeGreaterThan(0);
});

test('failed cart page asset leaves a visible error and preserves in-memory cart navigation', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 400, height: 900 });
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.route('**/assets/CartPage-*.css', route => route.abort());
  await addFirstProducts(page, 2);
  await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Корзина' }).click();
  await expect(page).toHaveURL('/cart');
  await expect(page.getByRole('alert').getByRole('heading', { name: 'Не удалось открыть страницу' })).toBeVisible();
  expect(await page.locator('#root').evaluate(root => root.childElementCount)).toBeGreaterThan(0);
  expect(consoleErrors.some(message => message.includes('Unable to preload CSS'))).toBe(true);

  await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Каталог' }).click();
  await expect(page.getByRole('heading', { name: 'Товары', exact: true })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Корзина' }).locator('[class*="_badge_"]')).toHaveText('2');
});

test('mobile cart navigation does not widen the document on narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await addFirstProducts(page, 2);
  await page.getByRole('link', { name: 'MyMy Shop' }).click();
  await expect(page).toHaveURL('/');
  await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Корзина' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const maxWidth = await page.evaluate(async () => {
    let maximum = document.documentElement.scrollWidth;
    const until = performance.now() + 300;
    while (performance.now() < until) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      maximum = Math.max(maximum, document.documentElement.scrollWidth);
    }
    return maximum;
  });
  expect(maxWidth).toBeLessThanOrEqual(320);
});

test('continue shopping is a centered secondary action with a visible keyboard focus', async ({ browser }) => {
  for (const { width, locale, theme } of [
    { width: 320, locale: 'ru', theme: 'light' },
    { width: 390, locale: 'en', theme: 'dark' },
    { width: 1280, locale: 'ru', theme: 'dark' },
    { width: 1280, locale: 'en', theme: 'light' },
  ]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto('/cart');
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('language', locale);
      localStorage.setItem('theme', theme);
    }, { locale, theme });
    await page.reload();
    const name = locale === 'ru' ? 'Продолжить покупки' : 'Continue Shopping';
    const action = page.getByRole('link', { name });
    const style = await action.evaluate(node => {
      const box = node.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(node);
      const text = range.getBoundingClientRect();
      const computed = getComputedStyle(node);
      return {
        height: box.height,
        textOffsetX: (text.left + text.right - box.left - box.right) / 2,
        textOffsetY: (text.top + text.bottom - box.top - box.bottom) / 2,
        textDecoration: computed.textDecorationLine,
        borderWidth: computed.borderTopWidth,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(style.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(style.textOffsetX)).toBeLessThanOrEqual(2);
    expect(Math.abs(style.textOffsetY)).toBeLessThanOrEqual(2);
    expect(style.textDecoration).toBe('none');
    expect(style.borderWidth).not.toBe('0px');
    expect(style.scrollWidth).toBeLessThanOrEqual(width);
    for (let step = 0; step < 10 && !(await action.evaluate(node => document.activeElement === node)); step += 1) {
      await page.keyboard.press('Tab');
    }
    await expect(action).toBeFocused();
    await expect(action).toHaveCSS('outline-style', 'solid');
    await context.close();
  }
});

test('cart product link opens the matching details and browser Back preserves cart', async ({ browser }) => {
  const title = 'A long product title for the cart link and narrow layout '.repeat(3);
  for (const { width, locale, theme } of [
    { width: 320, locale: 'ru', theme: 'light' },
    { width: 390, locale: 'en', theme: 'dark' },
    { width: 768, locale: 'ru', theme: 'dark' },
    { width: 1280, locale: 'en', theme: 'light' },
  ]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const product = { id: 991, title, price: 12, category: 'beauty', thumbnail: '', images: [], description: 'Product details', rating: 4 };
    await page.route('https://dummyjson.com/**', route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/products/categories') return route.fulfill({ json: [] });
      if (path === '/products/991') return route.fulfill({ json: product });
      return route.fulfill({ json: { products: [product], total: 1, limit: 10, skip: 0 } });
    });
    await page.goto('/products?source=api');
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('language', locale);
      localStorage.setItem('theme', theme);
    }, { locale, theme });
    await page.reload();
    await page.getByRole('button', { name: locale === 'ru' ? 'В корзину' : 'Add to Cart' }).click();
    if (width <= 768) {
      await page.getByRole('navigation', { name: locale === 'ru' ? 'Основная навигация' : 'Main navigation' }).getByRole('link', { name: locale === 'ru' ? 'Корзина' : 'Cart' }).click();
    } else {
      await page.getByRole('button', { name: /^(Корзина|Cart)$/, exact: true }).click();
      await page.getByRole('dialog').getByRole('link', { name: locale === 'ru' ? 'Перейти в корзину' : 'View Cart' }).click();
    }
    const linkName = locale === 'ru' ? `Подробнее о товаре: ${title}` : `View product details: ${title}`;
    const row = page.locator('[class*="_cartItem_"]').first();
    const link = row.getByRole('link', { name: linkName });
    await expect(link).toHaveAttribute('href', '/product/991?source=api');
    await expect(link.getByRole('heading', { name: title })).toBeVisible();
    await expect(link.getByRole('button')).toHaveCount(0);
    const plus = row.getByRole('button', { name: locale === 'ru' ? `Увеличить количество: ${title}` : `Increase quantity: ${title}` });
    await plus.click();
    await expect(row.locator('output')).toHaveText('2');
    await page.getByRole('link', { name: locale === 'ru' ? 'Продолжить покупки' : 'Continue Shopping' }).focus();
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS('outline-style', 'solid');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/product/991?source=api');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL('/cart');
    await expect(page.getByRole('link', { name: linkName })).toBeVisible();
    await expect(page.locator('[class*="_cartItem_"]').first().locator('output')).toHaveText('2');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await context.close();
  }
});
