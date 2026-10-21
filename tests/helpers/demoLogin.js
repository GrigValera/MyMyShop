import { expect } from '@playwright/test';

export async function signInDemo(page, language = 'ru') {
  await page.getByLabel(language === 'ru' ? 'Электронная почта' : 'Email').fill('demo@mymyshop.dev');
  await page.getByLabel(language === 'ru' ? 'Пароль' : 'Password', { exact: true }).fill('DemoShop-2026!');
  await page.locator('main').getByRole('button', { name: language === 'ru' ? 'Войти' : 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/account(?:\/|$)/);
}
