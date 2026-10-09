import { test, expect } from '@playwright/test';

for (const { width, height } of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 400, height: 800 },
  { width: 480, height: 800 },
]) {
  test(`mobile footer links and ChatBot remain independently clickable at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const route of ['/register', '/profile', '/login', '/forgot-password']) {
      await page.goto(route);
      const footer = page.locator('footer');
      const about = footer.locator('a[href="/about"]');
      const delivery = footer.locator('a[href="/delivery"]');
      const chat = page.getByRole('button', { name: 'Задать вопрос' });
      await footer.evaluate(element => element.scrollIntoView({ block: 'end' }));

      const geometry = await page.evaluate(() => {
        const footerLinks = [...document.querySelectorAll('footer a')].filter(link => getComputedStyle(link).display !== 'none' && link.getClientRects().length);
        const chatButton = document.querySelector('button[aria-label="Задать вопрос"]');
        const nav = document.querySelector('nav[aria-label="Основная навигация"]');
        const homeLink = nav.querySelector('a[href="/"]');
        const chatBox = chatButton.getBoundingClientRect();
        const navBox = nav.getBoundingClientRect();
        const hit = element => {
          const box = element.getBoundingClientRect();
          const target = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return element === target || element.contains(target);
        };
        return {
          overlap: footerLinks.some(link => {
            const box = link.getBoundingClientRect();
            return box.left < chatBox.right && box.right > chatBox.left && box.top < chatBox.bottom && box.bottom > chatBox.top;
          }),
          footerHit: footerLinks.every(hit),
          chatHit: hit(chatButton),
          navHit: hit(homeLink),
          aboveNav: footerLinks.every(link => link.getBoundingClientRect().bottom <= navBox.top) && chatBox.bottom <= navBox.top,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(geometry).toEqual({ overlap: false, footerHit: true, chatHit: true, navHit: true, aboveNav: true, overflow: false });

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
      await expect(about).toBeVisible();
      await expect(delivery).toBeVisible();
      await delivery.click();
      await expect(page).toHaveURL('/delivery');
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
  const footerLink = page.locator('footer a[href="/delivery"]');
  await footerLink.scrollIntoViewIfNeeded();
  await footerLink.tap();
  await expect(page).toHaveURL('/delivery');
  await context.close();
});
