import { test, expect } from '@playwright/test';

test('sign in validates fields and offers accessible password control', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Войти в демо' }).click();
  await expect(page.getByRole('textbox', { name: 'Электронная почта' })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Пароль', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('bad');
  await page.getByRole('button', { name: 'Войти в демо' }).click();
  await expect(page.getByText('Укажите корректный адрес электронной почты.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Электронная почта' }).fill('demo@example.test');
  const password = page.getByLabel('Пароль', { exact: true });
  await password.fill('demo-password');
  await page.getByRole('button', { name: 'Показать пароль' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Скрыть пароль' }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await password.press('Enter');
  await expect(page).toHaveURL('/profile');
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Demo User' })).toHaveCount(0);
});

test('sign up reports that no account is created and can continue as demo user', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Создать аккаунт' }).click();
  await expect(page).toHaveURL('/register');
  await page.getByRole('button', { name: 'Проверить форму' }).click();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(4);
  await page.getByLabel('Имя').fill('Demo');
  await page.getByLabel('Электронная почта').fill('invalid');
  await page.getByLabel('Пароль', { exact: true }).fill('password-one');
  await page.getByLabel('Повторите пароль').fill('password-two');
  await page.getByRole('button', { name: 'Проверить форму' }).click();
  await expect(page.getByText('Укажите корректный адрес электронной почты.')).toBeVisible();
  await expect(page.getByText('Пароли не совпадают.')).toBeVisible();
  await page.getByLabel('Электронная почта').fill('demo@example.test');
  await page.getByLabel('Повторите пароль').fill('password-one');
  await page.getByRole('button', { name: 'Проверить форму' }).click();
  await expect(page.getByRole('status')).toContainText('реальный аккаунт не создан');
  await page.getByRole('button', { name: 'Войти как демо-пользователь' }).click();
  await expect(page).toHaveURL('/profile');
});

test('recovery validates email and never claims a message was sent', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Забыли пароль?' }).click();
  await expect(page).toHaveURL('/forgot-password');
  await page.getByRole('button', { name: 'Проверить запрос' }).click();
  await expect(page.getByLabel('Электронная почта')).toHaveAttribute('aria-invalid', 'true');
  await page.getByLabel('Электронная почта').fill('invalid');
  await page.getByRole('button', { name: 'Проверить запрос' }).click();
  await expect(page.getByText('Укажите корректный адрес электронной почты.')).toBeVisible();
  await page.getByLabel('Электронная почта').fill('demo@example.test');
  await page.getByRole('button', { name: 'Проверить запрос' }).click();
  await expect(page.getByRole('status')).toContainText('письмо для восстановления не отправлено');
  await page.getByRole('link', { name: 'Вернуться ко входу' }).click();
  await expect(page).toHaveURL('/login');
});

test('auth routes fit mobile and translate in dark mode', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => { localStorage.setItem('language', 'en'); localStorage.setItem('theme', 'dark'); });
  await page.reload();
  for (const width of [320, 390, 400, 480, 768, 769, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 720 });
    for (const route of ['/login', '/register', '/forgot-password']) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
  await expect(page.getByRole('heading', { name: 'Recover access' })).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/dark/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('document language follows the locale switch and survives reload', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await page.getByText('EN', { exact: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByText('RU', { exact: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});

test('auth links are links and long forms clear the footer at target sizes', async ({ page }) => {
  for (const { width, height } of [
    { width: 1280, height: 900 }, { width: 1280, height: 720 },
    { width: 1024, height: 768 }, { width: 769, height: 800 },
    { width: 390, height: 844 }, { width: 320, height: 568 },
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of ['/login', '/register', '/forgot-password']) {
      await page.goto(route);
      const back = page.getByRole('link', { name: 'Вернуться ко входу' });
      if (route !== '/login') await expect(back).toHaveAttribute('href', '/login');
      const geometry = await page.evaluate(() => {
        const card = document.querySelector('main h1').closest('[class*="_card_"]');
        const footer = document.querySelector('footer');
        return {
          cardBottom: card.getBoundingClientRect().bottom,
          footerTop: footer.getBoundingClientRect().top,
          footerFixed: getComputedStyle(footer).position === 'fixed',
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(geometry.overflow).toBe(false);
      expect(geometry.footerFixed).toBe(false);
      expect(geometry.cardBottom).toBeLessThanOrEqual(geometry.footerTop);
    }
  }
});
