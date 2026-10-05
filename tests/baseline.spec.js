import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://dummyjson.com/**', route => route.abort());
});

test('integration: production entry point renders local products offline', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ограниченное предложение' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'В корзину', exact: true }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('E2E: sale item can be added, counted and opened in cart', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const title = await page.getByRole('heading', { level: 3 }).first().textContent();
  const add = page.getByRole('button', { name: 'В корзину', exact: true }).first();
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
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveValue('3');
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(page.getByText('Здесь пока пусто, пора это исправить!')).toBeVisible();
  expect(errors).toEqual([]);
});
