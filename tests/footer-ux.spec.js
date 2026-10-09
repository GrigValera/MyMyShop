import { test, expect } from '@playwright/test';

const mobileSizes = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 400, height: 800 },
  { width: 480, height: 800 },
  { width: 768, height: 1024 },
];

for (const { width, height } of mobileSizes) {
  test(`mobile footer exposes only secondary links at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const footer = page.locator('footer');
    const nav = page.getByRole('navigation', { name: 'Основная навигация' });
    const about = footer.locator('a[href="/about"]');
    const delivery = footer.locator('a[href="/delivery"]');
    await expect(footer.getByRole('heading', { name: 'Информация' })).toBeVisible();
    await expect(footer.locator('a:visible')).toHaveCount(2);
    await expect(about).toBeVisible();
    await expect(delivery).toBeVisible();
    await expect(footer.locator('button[aria-expanded]')).toHaveCount(0);
    for (const destination of ['/', '/products', '/cart', '/account']) {
      await expect(nav.locator(`a[href="${destination}"]`)).toBeVisible();
      await expect(footer.locator(`a[href="${destination}"]`)).toBeHidden();
    }
    await delivery.scrollIntoViewIfNeeded();
    const linkBox = await delivery.boundingBox();
    const navBox = await nav.boundingBox();
    expect(linkBox.y + linkBox.height).toBeLessThanOrEqual(navBox.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('secondary links have natural keyboard order and visible focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const footer = page.locator('footer');
  const about = footer.locator('a[href="/about"]');
  const delivery = footer.locator('a[href="/delivery"]');
  await about.focus();
  expect(await about.evaluate(element => element.matches(':focus-visible'))).toBe(true);
  await page.keyboard.press('Tab');
  await expect(delivery).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/delivery');
});

test('desktop footer groups lead to supported routes in RU and EN', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const footer = page.locator('footer');
  const destinations = ['/products', '/cart', '/about', '/delivery'];
  await expect(footer.getByRole('heading', { name: 'Покупки' })).toBeVisible();
  await expect(footer.getByRole('heading', { name: 'Информация' })).toBeVisible();
  expect(await footer.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(destinations);
  expect(await footer.locator('a[href="#"]').count()).toBe(0);
  expect(await footer.locator('a[href="/"]').count()).toBe(0);
  for (const destination of destinations) {
    await footer.locator(`a[href="${destination}"]`).click();
    await expect(page).toHaveURL(destination);
    await expect(page.locator('h1').first()).toBeVisible();
  }
  await page.evaluate(() => localStorage.setItem('language', 'en'));
  await page.reload();
  await expect(footer.getByRole('heading', { name: 'Shopping' })).toBeVisible();
  await expect(footer.getByRole('heading', { name: 'Information' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Delivery' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(footer.getByRole('heading', { name: 'Shopping' })).toBeHidden();
  await expect(footer.getByRole('heading', { name: 'Information' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'About Us' })).toBeVisible();
});

test('global footer keeps its responsive structure across shell routes', async ({ page }) => {
  for (const { width, height } of [
    ...mobileSizes,
    { width: 769, height: 800 },
    { width: 1024, height: 768 },
    { width: 1280, height: 720 },
    { width: 1280, height: 900 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of ['/', '/products', '/profile', '/login', '/register', '/forgot-password', '/cart']) {
      await page.goto(route);
      await expect(page.locator('footer')).toBeVisible();
      await expect(page.locator('footer a[href="/delivery"]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
});
