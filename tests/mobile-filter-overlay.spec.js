import { test, expect } from '@playwright/test';

const cases = [
  { language: 'ru', theme: 'light', filters: 'Фильтры', close: 'Закрыть' },
  { language: 'ru', theme: 'dark', filters: 'Фильтры', close: 'Закрыть' },
  { language: 'en', theme: 'light', filters: 'Filters', close: 'Close' },
  { language: 'en', theme: 'dark', filters: 'Filters', close: 'Close' },
];

test.beforeEach(async ({ page }) => {
  await page.route('https://cdn.dummyjson.com/**', route => route.abort());
});

for (const { language, theme, filters, close } of cases) {
  test(`${language} ${theme}: modal filters contain focus and restore it`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/products');
    await page.evaluate(({ language, theme }) => {
      localStorage.setItem('language', language);
      localStorage.setItem('theme', theme);
    }, { language, theme });
    await page.reload();

    const trigger = page.getByRole('button', { name: filters });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: filters });
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(dialog.getByRole('heading', { name: filters })).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe('fixed');

    await dialog.getByRole('button', { name: /Применить|Apply/ }).focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: close })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: /Применить|Apply/ })).toBeFocused();
    expect(await page.evaluate(() => document.activeElement?.closest('dialog')?.id)).toBe('catalog-filter-dialog');

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe('');

    await trigger.click();
    await dialog.getByRole('button', { name: close }).click();
    await expect(trigger).toBeFocused();
  });
}

test('mobile geometry, background and backdrop follow modal contract', async ({ page }) => {
  for (const [width, height] of [[320, 568], [360, 640], [375, 667], [390, 844], [393, 852], [412, 915], [430, 932], [480, 900], [768, 900]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/products');
    const trigger = page.getByRole('button', { name: 'Фильтры' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Фильтры' });
    await expect(dialog).toBeVisible();
    const state = await page.evaluate(() => {
      const dialog = document.querySelector('dialog#catalog-filter-dialog');
      const box = dialog.getBoundingClientRect();
      const chat = document.querySelector('[class*="_chatBot_"]');
      const nav = document.querySelector('nav[aria-label="Основная навигация"]');
      const hit = element => {
        const rect = element.getBoundingClientRect();
        const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return top === element || element.contains(top);
      };
      return {
        dialogFits: box.left >= -1 && box.right <= innerWidth + 1 && box.top >= -1 && box.bottom <= innerHeight + 1,
        contentScrolls: dialog.querySelector('[class*="_drawerContent_"]').scrollHeight > dialog.querySelector('[class*="_drawerContent_"]').clientHeight,
        chatReceivesPointer: hit(chat),
        navReceivesPointer: hit(nav),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(state.dialogFits).toBe(true);
    expect(state.chatReceivesPointer).toBe(false);
    expect(state.navReceivesPointer).toBe(false);
    expect(state.overflow).toBe(false);
    if (width === 320) expect(state.contentScrolls).toBe(true);
    await dialog.getByRole('button', { name: 'Закрыть' }).click();
    await expect(trigger).toBeFocused();
  }

  await page.setViewportSize({ width: 769, height: 900 });
  await page.goto('/products');
  const trigger = page.getByRole('button', { name: 'Фильтры' });
  await trigger.click();
  await page.mouse.click(5, 200);
  await expect(page.getByRole('dialog', { name: 'Фильтры' })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('resize and route change release the modal and preserve filter state', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/products');
  const trigger = page.getByRole('button', { name: 'Фильтры' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Фильтры' });
  await dialog.getByRole('button', { name: 'beauty' }).click();
  await page.setViewportSize({ width: 769, height: 900 });
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe('');
  await page.setViewportSize({ width: 390, height: 844 });
  await trigger.click();
  await expect(dialog.getByRole('button', { name: 'beauty' })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/cart');
  await expect(page.locator('dialog#catalog-filter-dialog')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe('');
});

test('closing filters restores the catalog scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/products');
  await expect(page.getByRole('button', { name: 'Фильтры' })).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, 600);
    document.querySelector('button[aria-controls="catalog-filter-dialog"]').click();
  });
  const dialog = page.getByRole('dialog', { name: 'Фильтры' });
  await expect(dialog).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.top)).toBe('-600px');
  await dialog.getByRole('button', { name: 'Закрыть' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
  await expect.poll(() => page.evaluate(() => document.body.style.top)).toBe('');
});

test('browser Back during an open modal leaves no ghost overlay', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Смотреть весь каталог' }).click();
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await expect(page.getByRole('dialog', { name: 'Фильтры' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL('/');
  await expect(page.locator('dialog#catalog-filter-dialog')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.position)).toBe('');
});
