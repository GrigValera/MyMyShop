import { test, expect } from '@playwright/test';

for (const { width, locale, theme, action, title, message } of [
  { width: 1280, locale: 'ru', theme: 'light', action: 'Посмотреть оформление', title: 'Оформление пока недоступно', message: 'заказ не создан' },
  { width: 320, locale: 'en', theme: 'dark', action: 'Preview checkout', title: 'Checkout is not available yet', message: 'no order was created' },
]) {
  test(`checkout preview is honest and retains cart at ${width}px in ${locale}`, async ({ page }) => {
    const dialogs = [];
    page.on('dialog', dialog => { dialogs.push(dialog.message()); dialog.dismiss(); });
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/products');
    await page.evaluate(({ locale, theme }) => {
      localStorage.setItem('language', locale);
      localStorage.setItem('theme', theme);
    }, { locale, theme });
    await page.reload();
    const add = locale === 'ru' ? 'В корзину' : 'Add to Cart';
    await page.getByRole('button', { name: add }).first().click();
    await page.goto('/cart');
    const item = page.locator('[class*="_cartItem_"]').first();
    const name = await item.getByRole('heading').textContent();
    await item.getByRole('button', { name: locale === 'ru' ? `Увеличить количество: ${name}` : `Increase quantity: ${name}` }).click();
    await expect(item.locator('output')).toHaveText('2');
    await expect(page.getByText('$5.99')).toHaveCount(0);
    const cartSubtotal = await page.locator('[class*="_summaryRow_"]').last().locator('span').last().textContent();
    const checkout = page.getByRole('link', { name: action });
    await expect(checkout).toHaveAttribute('href', '/checkout');
    for (let step = 0; step < 30 && !(await checkout.evaluate(node => document.activeElement === node)); step += 1) {
      await page.keyboard.press('Tab');
    }
    await expect(checkout).toBeFocused();
    await expect(checkout).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByRole('heading', { name: locale === 'ru' ? 'Просмотр оформления' : 'Checkout preview' })).toBeFocused();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText(message, { exact: false })).toBeVisible();
    const summary = page.getByRole('region', { name: locale === 'ru' ? 'Товары в корзине' : 'Items in your cart' });
    const line = summary.getByRole('listitem');
    await expect(line).toContainText(name);
    await expect(line).toContainText(locale === 'ru' ? 'Количество: 2' : 'Quantity: 2');
    await expect(summary.getByText(locale === 'ru' ? 'Товаров' : 'Items', { exact: true })).toBeVisible();
    await expect(summary.getByText(locale === 'ru' ? 'Стоимость товаров' : 'Items subtotal', { exact: true })).toBeVisible();
    await expect(summary.locator('[class*="_itemCount_"] strong')).toHaveText('2');
    await expect(summary.locator('[class*="_subtotal_"] strong')).toHaveText(cartSubtotal);
    await expect(line.locator('strong')).toHaveText(cartSubtotal);
    await expect(summary.getByText(locale === 'ru'
      ? 'Стоимость доставки и окончательная сумма пока не рассчитываются.'
      : 'Delivery cost and final total are not calculated yet.')).toBeVisible();
    await expect(page.getByText(locale === 'ru' ? 'Заказ оформлен' : 'Order placed', { exact: true })).toHaveCount(0);
    await expect(summary.getByText(locale === 'ru' ? 'Итого к оплате' : 'Final total', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /place order|оформить заказ/i })).toHaveCount(0);
    expect(dialogs).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.reload();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.getByRole('link', { name: locale === 'ru' ? 'Вернуться в корзину' : 'Back to cart' }).click();
    await expect(item.locator('output')).toHaveText('2');
  });
}

test('preview does not change deterministic Account Orders or clear the cart', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: 'В корзину' }).first().click();
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('checkout@example.test');
  await page.getByLabel('Пароль', { exact: true }).fill('demo-password');
  await page.getByRole('button', { name: 'Войти в демо' }).click();
  await expect(page).toHaveURL('/account');
  await page.getByRole('link', { name: 'Заказы', exact: true }).first().click();
  const before = await page.getByRole('article').allTextContents();
  await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Личный кабинет' }).click();
  await page.getByRole('navigation', { name: 'Мои покупки' }).getByRole('link', { name: 'Корзина 1 товар' }).click();
  await page.getByRole('link', { name: 'Посмотреть оформление' }).click();
  await page.getByRole('link', { name: 'Вернуться в корзину' }).click();
  await page.goBack();
  await page.goBack();
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL('/account/orders');
  await expect(page.getByRole('heading', { name: 'Заказы' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(3);
  expect(await page.getByRole('article').allTextContents()).toEqual(before);
  await expect(page.getByRole('heading', { name: 'Заказ № MS-2026-103' })).toBeVisible();
  await expect(page.locator('[id="mobile-cart-count"]')).toContainText('1');
});
