import { signInDemo } from './helpers/demoLogin.js';
import { establishDefaultDemoProfile } from './helpers/demoProfile.js';
import { test, expect } from '@playwright/test';

test('login fields keep full-size geometry, visible focus and an inset password action', async ({ page }) => {
  await page.goto('/login');
  const email = page.getByLabel('Электронная почта');
  const password = page.getByLabel('Пароль', { exact: true });
  const toggle = page.getByRole('button', { name: 'Показать пароль' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const emailBox = await email.boundingBox();
    const passwordBox = await password.boundingBox();
    const toggleBox = await toggle.boundingBox();
    expect(emailBox.width).toBeGreaterThan(220);
    expect(emailBox.height).toBeGreaterThanOrEqual(44);
    expect(passwordBox.width).toBe(emailBox.width);
    expect(passwordBox.height).toBe(emailBox.height);
    expect(toggleBox.x).toBeGreaterThan(passwordBox.x + passwordBox.width / 2);
    expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(passwordBox.x + passwordBox.width);
    expect(toggleBox.y).toBeGreaterThanOrEqual(passwordBox.y);
    expect(toggleBox.y + toggleBox.height).toBeLessThanOrEqual(passwordBox.y + passwordBox.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await email.focus();
  await expect(email).not.toHaveCSS('box-shadow', 'none');
  await email.fill('a'.repeat(180) + '@example.com');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await email.fill('');
  const beforeError = await email.boundingBox();
  await page.locator('main button[type="submit"]').click();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toHaveAttribute('aria-describedby', 'email-error');
  await expect(page.locator('#email-error')).toHaveAttribute('role', 'alert');
  expect(await email.boundingBox()).toEqual(beforeError);
  const beforeToggle = await password.boundingBox();
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Скрыть пароль' })).toHaveAttribute('aria-pressed', 'true');
  expect(await password.boundingBox()).toEqual(beforeToggle);
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  await expect(email).not.toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('direct login load, reload and SPA return keep input styles consistent under the autofill selector', async ({ page }) => {
  const email = page.locator('main input[name="email"]');
  const password = page.locator('main input[name="password"]');
  const readStyles = async () => page.evaluate(() => ['email', 'password'].map(name => {
    const input = document.querySelector(`main input[name="${name}"]`);
    const style = getComputedStyle(input);
    const bounds = input.getBoundingClientRect();
    return {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      borderRadius: style.borderRadius,
      padding: style.padding,
      width: bounds.width,
      height: bounds.height,
      fillColor: style.webkitTextFillColor,
      background: getComputedStyle(document.body).backgroundColor,
      shadow: style.boxShadow,
      transition: style.transitionProperty,
    };
  }));
  const forceAutofill = async () => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    for (const name of ['email', 'password']) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `main input[name="${name}"]` });
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['autofill'] });
    }
  };

  await page.goto('/login');
  await expect(email).toBeVisible();
  await expect(email).toHaveAttribute('autocomplete', 'username');
  await expect(password).toHaveAttribute('autocomplete', 'current-password');
  const direct = await readStyles();
  await page.reload();
  await expect(email).toBeVisible();
  expect(await readStyles()).toEqual(direct);
  await page.getByRole('link', { name: 'MyMy Shop' }).click();
  await page.getByRole('button', { name: 'Войти' }).first().click();
  await expect(email).toBeVisible();
  expect(await readStyles()).toEqual(direct);

  await forceAutofill();
  const autofilled = await readStyles();
  for (let index = 0; index < autofilled.length; index += 1) {
    expect(autofilled[index].fontFamily).toBe(direct[index].fontFamily);
    expect(autofilled[index].fontSize).toBe(direct[index].fontSize);
    expect(autofilled[index].fontWeight).toBe(direct[index].fontWeight);
    expect(autofilled[index].lineHeight).toBe(direct[index].lineHeight);
    expect(autofilled[index].borderRadius).toBe(direct[index].borderRadius);
    expect(autofilled[index].padding).toBe(direct[index].padding);
    expect(autofilled[index].width).toBe(direct[index].width);
    expect(autofilled[index].height).toBe(direct[index].height);
    expect(autofilled[index].fillColor).toBe(direct[index].fillColor);
    expect(autofilled[index].shadow.startsWith(autofilled[index].background)).toBe(true);
    expect(autofilled[index].shadow).toContain('1000px inset');
    expect(autofilled[index].transition).not.toContain('box-shadow');
  }
  await email.focus();
  expect((await readStyles())[0].shadow).toContain('1000px inset');
  expect((await readStyles())[0].shadow).toContain('3px');

  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.reload();
  await expect(email).toBeVisible();
  const dark = await readStyles();
  await forceAutofill();
  const darkAutofilled = await readStyles();
  for (let index = 0; index < darkAutofilled.length; index += 1) {
    expect(darkAutofilled[index].fillColor).toBe(dark[index].fillColor);
    expect(darkAutofilled[index].fontFamily).toBe(dark[index].fontFamily);
    expect(darkAutofilled[index].fontSize).toBe(dark[index].fontSize);
    expect(darkAutofilled[index].borderRadius).toBe(dark[index].borderRadius);
    expect(darkAutofilled[index].shadow.startsWith(darkAutofilled[index].background)).toBe(true);
    expect(darkAutofilled[index].shadow).toContain('1000px inset');
    expect(darkAutofilled[index].transition).not.toContain('box-shadow');
    expect(darkAutofilled[index].width).toBe(dark[index].width);
    expect(darkAutofilled[index].height).toBe(dark[index].height);
  }
  await email.fill('demo@mymyshop.dev');
  await password.fill('DemoShop-2026!');
  await page.getByRole('button', { name: 'Показать пароль' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(email).toHaveValue('demo@mymyshop.dev');
  await expect(password).toHaveValue('DemoShop-2026!');
});

test('demo credentials are visible and server login persists after reload', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await page.goto('/login');
  await expect(page.getByLabel('Пароль', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Электронная почта')).toBeVisible();
  const demo = page.getByRole('region', { name: 'Доступ к демо' });
  await expect(demo.getByRole('heading', { name: 'Доступ к демо' })).toBeVisible();
  await expect(demo.locator('dt')).toHaveText(['Электронная почта', 'Пароль']);
  await expect(demo.locator('dd')).toHaveText(['demo@mymyshop.dev', 'DemoShop-2026!']);
  await expect(demo.locator('code')).toHaveCount(0);
  const card = page.locator('main h1').locator('..');
  await expect(card).toHaveAttribute('class', /staticSurface/);
  await expect(card).not.toHaveAttribute('class', /clickable/);
  const restingShadow = await card.evaluate(element => getComputedStyle(element).boxShadow);
  await card.hover();
  await expect(card).toHaveCSS('transform', 'none');
  await expect(card).toHaveCSS('box-shadow', restingShadow);
  const type = await demo.locator('dd').first().evaluate(element => ({
    family: getComputedStyle(element).fontFamily,
    size: getComputedStyle(element).fontSize,
    bodyFamily: getComputedStyle(document.body).fontFamily,
  }));
  expect(type.family).toBe(type.bodyFamily);
  expect(type.size).toBe('16px');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await signInDemo(page);
  await expect(page).toHaveURL('/account');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Demo User' })).toBeVisible();
});

test('login keeps one unavailable card through repeated failed retries', async ({ page }) => {
  await page.route('**/api/v1/session', route => route.request().method() === 'GET' ? route.abort() : route.continue());
  await page.goto('/login');
  const error = page.getByRole('alert');
  await expect(error).toContainText('Сейчас не удалось проверить вход');
  const card = page.locator('main h1').locator('..');
  const originalBounds = await card.boundingBox();
  const retryButton = error.getByRole('button', { name: 'Повторить' });
  const originalButtonBounds = await retryButton.boundingBox();
  await card.evaluate(element => { element.dataset.retryIdentity = 'original'; });
  await page.unroute('**/api/v1/session');
  let requests = 0;
  let release;
  await page.route('**/api/v1/session', async route => {
    if (route.request().method() !== 'GET') return route.continue();
    requests += 1;
    await new Promise(resolve => { release = resolve; });
    await route.abort();
  });

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await retryButton.click();
    await expect(retryButton).toHaveText('Повторить');
    await expect(retryButton).toBeDisabled();
    await expect(retryButton).toHaveAttribute('aria-busy', 'true');
    await expect(retryButton.locator('[aria-hidden="true"]')).toBeVisible();
    expect(await retryButton.boundingBox()).toEqual(originalButtonBounds);
    await expect.poll(() => requests).toBe(attempt);
    await page.evaluate(() => { const button = document.querySelector('[role="alert"] button'); button.click(); button.click(); });
    expect(requests).toBe(attempt);
    await expect(card).toHaveAttribute('data-retry-identity', 'original');
    expect(await card.boundingBox()).toEqual(originalBounds);
    release();
    await expect(retryButton).toBeEnabled();
    await expect(retryButton).toHaveText('Повторить');
    await expect(retryButton).toHaveAttribute('aria-busy', 'false');
    await expect(retryButton.locator('[aria-hidden="true"]')).toBeHidden();
    await expect(error).toContainText('Сейчас не удалось проверить вход');
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(card).toHaveAttribute('data-retry-identity', 'original');
    expect(await card.boundingBox()).toEqual(originalBounds);
    expect(await retryButton.boundingBox()).toEqual(originalButtonBounds);
  }
  expect(requests).toBe(2);
});

test('login retry keeps its error card while the request is pending', async ({ page }) => {
  await page.route('**/api/v1/session', route => route.request().method() === 'GET' ? route.abort() : route.continue());
  await page.goto('/login');
  const error = page.getByRole('alert');
  await expect(error).toContainText('Сейчас не удалось проверить вход');
  await page.unroute('**/api/v1/session');
  let release;
  let requests = 0;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/api/v1/session', async route => {
    if (route.request().method() === 'GET') { requests += 1; await gate; }
    await route.continue();
  });
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(error).toContainText('Сейчас не удалось проверить вход');
  await expect(error.getByRole('button', { name: 'Повторить' })).toBeDisabled();
  await expect(error.getByRole('button', { name: 'Повторить' })).toHaveAttribute('aria-busy', 'true');
  await page.evaluate(() => { const button = document.querySelector('[role="alert"] button'); button.click(); button.click(); });
  expect(requests).toBe(1);
  release();
  await expect(page.getByRole('button', { name: 'Войти', exact: true }).last()).toBeVisible();
});

test('invalid and empty credentials stay on login without a session', async ({ page }) => {
  await page.goto('/login');
  await page.locator('main').getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByText('Заполните это поле.')).toHaveCount(2);
  await page.getByLabel('Электронная почта').fill('bad');
  await page.getByLabel('Пароль', { exact: true }).fill('wrong');
  await page.locator('main').getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByText('Укажите корректный адрес электронной почты.')).toBeVisible();
  await page.getByLabel('Электронная почта').fill('other@mymyshop.dev');
  await page.locator('main').getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Неверная почта или пароль');
  await expect(page).toHaveURL('/login');
  await expect(page.getByRole('button', { name: 'Профиль' })).toHaveCount(0);
  await page.getByLabel('Электронная почта').fill('demo@mymyshop.dev');
  await page.locator('main').getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Неверная почта или пароль');
  await expect(page).toHaveURL('/login');
  await page.getByLabel('Пароль', { exact: true }).fill('DemoShop-2026!');
  await page.locator('main').getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page).toHaveURL('/account');
});

test('backend failure during credential check cannot sign in', async ({ page }) => {
  await page.goto('/login');
  await page.route('**/api/v1/session', route => route.request().method() === 'POST' ? route.abort() : route.continue());
  await page.getByLabel('Электронная почта').fill('demo@mymyshop.dev');
  await page.getByLabel('Пароль', { exact: true }).fill('DemoShop-2026!');
  await page.locator('main').getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Сейчас не удалось войти');
  await expect(page).toHaveURL('/login');
});

test('registration and recovery state that identity integration is unavailable', async ({ page }) => {
  for (const route of ['/register', '/forgot-password']) {
    await page.goto(route);
    await expect(page.getByRole('status')).toContainText(/после подключения настоящей системы входа/);
    await expect(page.locator('main input')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Проверить|Создать/ })).toHaveCount(0);
    await page.getByRole('link', { name: 'Вернуться ко входу' }).click();
    await expect(page).toHaveURL('/login');
  }
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

test('auth cards clear the footer at target sizes', async ({ page }) => {
  for (const { width, height } of [{ width: 1280, height: 900 }, { width: 769, height: 800 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize({ width, height });
    for (const route of ['/login', '/register', '/forgot-password']) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      const geometry = await page.evaluate(() => {
        const card = document.querySelector('main h1').closest('[class*="_card_"]');
        const footer = document.querySelector('footer');
        return { cardBottom: card.getBoundingClientRect().bottom, footerTop: footer.getBoundingClientRect().top,
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(geometry.overflow).toBe(false);
      expect(geometry.cardBottom).toBeLessThanOrEqual(geometry.footerTop);
    }
  }
});
