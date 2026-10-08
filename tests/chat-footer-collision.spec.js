import { test, expect } from '@playwright/test';

for (const { width, height } of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 400, height: 800 },
  { width: 480, height: 800 },
]) {
  test(`mobile footer and ChatBot remain independently clickable at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const route of ['/register', '/profile', '/login', '/forgot-password']) {
      await page.goto(route);
      const footer = page.getByRole('button', { name: 'Развернуть подвал' });
      const chat = page.getByRole('button', { name: 'Задать вопрос' });
      await footer.evaluate(element => element.scrollIntoView({ block: 'end' }));

      const geometry = await page.evaluate(() => {
        const footerButton = document.querySelector('footer button[aria-expanded]');
        const chatButton = document.querySelector('button[aria-label="Задать вопрос"]');
        const nav = document.querySelector('nav[aria-label="Основная навигация"]');
        const homeLink = nav.querySelector('a[href="/"]');
        const footerBox = footerButton.getBoundingClientRect();
        const chatBox = chatButton.getBoundingClientRect();
        const navBox = nav.getBoundingClientRect();
        const hit = element => {
          const box = element.getBoundingClientRect();
          const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return element === target || element.contains(target);
        };
        return {
          overlap: footerBox.left < chatBox.right && footerBox.right > chatBox.left &&
            footerBox.top < chatBox.bottom && footerBox.bottom > chatBox.top,
          footerHit: hit(footerButton),
          chatHit: hit(chatButton),
          navHit: hit(homeLink),
          aboveNav: footerBox.bottom <= navBox.top && chatBox.bottom <= navBox.top,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(geometry).toEqual({ overlap: false, footerHit: true, chatHit: true, navHit: true, aboveNav: true, overflow: false });

      await footer.click();
      await expect(page.getByRole('button', { name: 'Свернуть подвал' })).toHaveAttribute('aria-expanded', 'true');
      await page.getByRole('button', { name: 'Свернуть подвал' }).click();
      await chat.click();
      const panel = page.locator('[class*="_chatWindow_"]');
      await expect(panel).toBeVisible();
      const panelBox = await panel.boundingBox();
      expect(panelBox.x).toBeGreaterThanOrEqual(0);
      expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(width);
      expect(panelBox.y).toBeGreaterThanOrEqual(0);
      await page.getByRole('button', { name: 'Закрыть' }).click();
      await expect(panel).toHaveCount(0);
      await expect(page.locator('[class*="_tooltip_"]')).toHaveCount(0);
      await expect(chat).toBeVisible();
      await footer.click();
      await expect(page.getByRole('button', { name: 'Свернуть подвал' })).toHaveAttribute('aria-expanded', 'true');
      await expect(panel).toHaveCount(0);
      await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible();
      await page.getByRole('navigation', { name: 'Основная навигация' }).locator('a[href="/"]').click();
      await expect(page).toHaveURL('/');
    }
  });
}

test('touch path leaves no ChatBot tooltip or blocking layer after close', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/register');
  await page.getByRole('button', { name: 'Задать вопрос' }).tap();
  await expect(page.locator('[class*="_chatWindow_"]')).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть' }).tap();
  await expect(page.locator('[class*="_chatWindow_"]')).toHaveCount(0);
  await expect(page.locator('[class*="_tooltip_"]')).toHaveCount(0);
  const footer = page.getByRole('button', { name: 'Развернуть подвал' });
  await footer.evaluate(element => element.scrollIntoView({ block: 'end' }));
  await footer.tap();
  await expect(page.getByRole('button', { name: 'Свернуть подвал' })).toHaveAttribute('aria-expanded', 'true');
  await context.close();
});
