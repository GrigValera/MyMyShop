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

for (const { width, language, theme } of [
  { width: 320, language: 'ru', theme: 'light' },
  { width: 390, language: 'ru', theme: 'light' },
  { width: 390, language: 'en', theme: 'dark' },
  { width: 430, language: 'ru', theme: 'light' },
  { width: 768, language: 'ru', theme: 'light' },
  { width: 769, language: 'ru', theme: 'light' },
]) {
  test(`filter selection keeps dialog position at ${width}px in ${language} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/products');
    await page.evaluate(({ language, theme }) => {
      localStorage.setItem('language', language);
      localStorage.setItem('theme', theme);
    }, { language, theme });
    await page.reload();

    await page.getByRole('button', { name: language === 'ru' ? 'Фильтры' : 'Filters' }).click();
    const dialog = page.getByRole('dialog', { name: language === 'ru' ? 'Фильтры' : 'Filters' });
    const measure = () => dialog.evaluate(element => {
      const content = element.querySelector('[class*="_drawerContent_"]');
      const sections = [...content.querySelectorAll('[class*="_filterSection_"]')];
      return {
        scrollTop: content.scrollTop,
        sectionY: sections.map(section => section.getBoundingClientRect().y),
      };
    });
    const stableAt = async (control, sectionIndex, action, waitForApplied) => {
      await control.scrollIntoViewIfNeeded();
      const before = await measure();
      await action();
      await waitForApplied();
      const after = await measure();
      expect(after.scrollTop).toBe(before.scrollTop);
      expect(Math.abs(after.sectionY[sectionIndex] - before.sectionY[sectionIndex])).toBeLessThanOrEqual(1);
    };

    const beauty = dialog.getByRole('button', { name: 'Beauty' });
    await stableAt(beauty, 0, () => beauty.click(), async () => {
      await expect.poll(() => new URL(page.url()).searchParams.getAll('category')).toEqual(['beauty']);
      await expect(dialog.getByTestId('drawer-active-filters')).toContainText('beauty');
    });

    const minPrice = dialog.locator('input[type="number"]').first();
    await stableAt(minPrice, 1, () => minPrice.fill('10'), async () => {
      await expect.poll(() => new URL(page.url()).searchParams.get('minPrice')).toBe('10');
      await expect(dialog.getByTestId('drawer-active-filters')).toContainText('10');
    });

    const fragrances = dialog.getByRole('button', { name: 'Fragrances' });
    await stableAt(fragrances, 0, () => fragrances.click(), async () => {
      await expect.poll(() => new URL(page.url()).searchParams.getAll('category')).toEqual(['beauty', 'fragrances']);
      await expect(dialog.getByTestId('drawer-active-filters')).toContainText('fragrances');
    });

    const sort = dialog.locator('input[type="radio"][value="asc"]');
    await stableAt(sort, 2, () => sort.check(), async () => {
      await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('asc');
      await expect(dialog.locator('[class*="_drawerCount_"]')).toHaveText('4');
    });
    await expect(dialog.locator('[class*="_drawerCount_"]')).toHaveText('4');
    await expect(dialog.getByTestId('drawer-active-filters')).toContainText('fragrances');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

    await dialog.getByRole('button', { name: /Применить|Apply/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('asc');
  });
}

for (const [width, height] of [[320, 568], [360, 640], [375, 667], [390, 844], [393, 852], [412, 915], [430, 932], [480, 900], [768, 900]]) {
  test(`mobile geometry, background and backdrop follow modal contract at ${width}x${height}`, async ({ page }) => {
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
  });
}

test('desktop backdrop closes the filter dialog and restores focus', async ({ page }) => {
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
