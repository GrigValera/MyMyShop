import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Only the external API is replaced; the real entry point, store and UI run.
  await page.route('https://dummyjson.com/**', async (route) => {
    expect(new URL(route.request().url()).pathname).toBe('/products');
    await route.fulfill({ json: { products: [{
      id: 1, title: 'Demo Lamp', price: 100, category: 'home-decoration',
      rating: 4.5, images: ['data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E'],
    }], total: 1, skip: 0, limit: 100 } });
  });
});

test('integration: production entry point renders API products', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ограниченное предложение' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Demo Lamp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'В корзину', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('E2E: sale item can be added, counted and opened in cart', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const add = page.getByRole('button', { name: 'В корзину', exact: true });
  await add.click();
  await add.click();
  await page.getByRole('button', { name: 'Cart', exact: true }).click();
  await expect(page.getByRole('spinbutton')).toHaveValue('2');
  await page.getByRole('spinbutton').fill('3');
  await expect(page.getByRole('spinbutton')).toHaveValue('3');
  await page.getByRole('link', { name: 'Перейти в корзину' }).click();
  await expect(page).toHaveURL('/cart');
  await expect(page.getByRole('heading', { name: 'Корзина', exact: true })).toBeVisible();
  await expect(page.getByText('Сводка заказа', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Demo Lamp' })).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveValue('3');
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(page.getByText('Здесь пока пусто, пора это исправить!')).toBeVisible();
  expect(errors).toEqual([]);
});
