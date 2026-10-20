import { signInDemo } from './helpers/demoLogin.js';
import { establishDefaultDemoProfile } from './helpers/demoProfile.js';
import { test, expect } from '@playwright/test';
import { Buffer, Blob } from 'node:buffer';
import { deflateSync } from 'node:zlib';
import { getInitials, validateDisplayName, validateAvatar, validateAvatarContent, MAX_DISPLAY_NAME_LENGTH } from '../src/features/account/model/profileValidation.js';

test('profile validation accepts Unicode names and supported files', () => {
  expect(getInitials('Demo User')).toBe('DU');
  expect(getInitials('Валерий')).toBe('В');
  expect(getInitials('  李   明  ')).toBe('李明');
  for (const value of ['', '   ']) expect(validateDisplayName(value)).toBe('required');
  for (const value of [' Valery ', 'Валерий Григорьев', 'x'.repeat(MAX_DISPLAY_NAME_LENGTH)]) expect(validateDisplayName(value)).toBeNull();
  expect(validateDisplayName('x'.repeat(MAX_DISPLAY_NAME_LENGTH + 1))).toBe('tooLong');
  for (const type of ['image/png', 'image/jpeg', 'image/webp']) expect(validateAvatar({ type, size: 200 })).toBeNull();
  expect(validateAvatar({ type: 'image/svg+xml', size: 200 })).toBe('unsupportedType');
  expect(validateAvatar({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })).toBe('tooLarge');
});

test('a file renamed to PNG cannot pass avatar content validation', async () => {
  const svg = new Blob(['<svg xmlns="http://www.w3.org/2000/svg"/>'], { type: 'image/png' });
  expect(await validateAvatarContent(svg)).toBe('unsupportedType');
});

async function signIn(page) {
  if (!page.url().endsWith('/login')) await page.goto('/login');
  await signInDemo(page);
  await expect(page).toHaveURL('/account');
}

function pngChunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of body) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, body, checksum]);
}

function pngFixture(width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const pixels = Buffer.alloc(height * (1 + width * 4));
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const offset = row * (1 + width * 4) + 1 + column * 4;
      pixels.set([column % 256, row % 256, 120, 255], offset);
    }
  }
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(pixels)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

test('protected route, edit, account identity and runtime reset', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await page.goto('/account/profile');
  await expect(page).toHaveURL(/\/login\?next=/);
  await signIn(page);
  await page.getByRole('link', { name: 'Редактировать профиль' }).click();
  await expect(page).toHaveURL('/account/profile');
  await expect(page.getByLabel('Электронная почта')).toHaveCount(0);
  const save = page.getByRole('button', { name: 'Сохранить изменения' });
  await expect(save).toBeDisabled();
  await page.getByLabel('Имя', { exact: true }).fill('  Валерий Григорьев  ');
  await save.click();
  await expect(page.getByRole('status').getByText(/Имя сохранено на сервере/)).toBeVisible();
  await expect(page.getByLabel('Имя', { exact: true })).toHaveValue('Валерий Григорьев');
  await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Личный кабинет' }).click();
  await expect(page.getByRole('heading', { name: 'Валерий Григорьев' })).toBeVisible();
  await page.getByRole('button', { name: 'Профиль' }).click();
  await expect(page.getByText('Валерий Григорьев').last()).toBeVisible();
  await page.getByRole('link', { name: 'Личный кабинет' }).last().click();
  await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Личные данные' }).click();
  await expect(page.getByLabel('Имя', { exact: true })).toHaveValue('Валерий Григорьев');
  await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Личный кабинет' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Валерий Григорьев' })).toBeVisible();
  await page.getByRole('button', { name: 'Выйти' }).click();
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Валерий Григорьев' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('heading', { name: 'Валерий Григорьев' })).toBeVisible();
  await page.getByRole('link', { name: 'Редактировать профиль' }).click();
  await page.getByLabel('Имя', { exact: true }).fill('Demo User');
  await page.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(page.getByRole('status').getByText(/Имя сохранено на сервере/)).toBeVisible();
  await expect(page.getByLabel('Имя', { exact: true })).toHaveValue('Demo User');
});

test('avatar preview, save, remove and file errors', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await signIn(page);
  await page.getByRole('link', { name: 'Редактировать профиль' }).click();
  const input = page.locator('#profile-avatar');
  await expect(input).toHaveAttribute('type', 'file');
  await expect(page.getByLabel('Добавить фото')).toBeAttached();
  await expect(page.locator('label[for="profile-avatar"]')).toHaveText('Добавить фото');
  await input.setInputFiles({ name: 'unsafe.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByText('Выберите изображение JPEG, PNG или WebP.')).toBeVisible();
  await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(page.getByText('Выберите изображение меньше 2 МиБ.')).toBeVisible();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText('Выберите изображение меньше 2 МиБ.')).toHaveCount(0);
  await expect(page.locator('label[for="profile-avatar"]')).toHaveText('Изменить фото');
  await expect(page.getByText('Выбрано: avatar.png')).toBeVisible();
  await expect(page.locator('img[src^="blob:"]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(page.locator('label[for="profile-avatar"]')).toHaveText('Изменить фото');
  await expect(page.getByText('Выбрано: avatar.png')).toHaveCount(0);
  await expect(page.getByText(/Файл не выбран|No file chosen/i)).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Личный кабинет' }).click();
  await expect(page.locator('img[src^="blob:"]').first()).toBeVisible();
  await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Личные данные' }).click();
  await expect(page.locator('label[for="profile-avatar"]')).toHaveText('Изменить фото');
  await page.getByRole('button', { name: 'Удалить фото' }).click();
  await expect(page.locator('label[for="profile-avatar"]')).toHaveText('Добавить фото');
  await page.getByRole('button', { name: 'Сохранить изменения' }).click();
  await expect(page.locator('label[for="profile-avatar"]')).toHaveText('Добавить фото');
  await expect(page.locator('img[src^="blob:"]')).toHaveCount(0);
  await expect(page.getByRole('img', { name: 'Аватар Demo User' })).toContainText('DU');
});

test('portrait, landscape and square avatars keep circular geometry and clear controls', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await signIn(page);
  await page.getByRole('link', { name: 'Редактировать профиль' }).click();
  const avatar = page.getByRole('img', { name: 'Аватар Demo User' });
  const image = avatar.locator('img');
  const trigger = page.locator('label[for="profile-avatar"]');
  const input = page.locator('#profile-avatar');
  const variants = [['portrait', 48, 96], ['landscape', 96, 48], ['square', 64, 64]];
  for (const width of [320, 390, 400, 480, 768, 769, 1280]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    const size = width <= 360 ? 56 : 72;
    for (const [shape, imageWidth, imageHeight] of variants) {
      await input.setInputFiles({ name: `${shape}.png`, mimeType: 'image/png', buffer: pngFixture(imageWidth, imageHeight) });
      await expect(trigger).toHaveText('Изменить фото');
      await expect(image).toBeVisible();
      await expect(image).toHaveCSS('object-fit', 'cover');
      expect(await image.evaluate((element) => [element.naturalWidth, element.naturalHeight])).toEqual([imageWidth, imageHeight]);
      const avatarBox = await avatar.boundingBox();
      const imageBox = await image.boundingBox();
      expect(avatarBox.width).toBe(size);
      expect(avatarBox.height).toBe(size);
      expect(imageBox.width).toBeLessThanOrEqual(size);
      expect(imageBox.height).toBeLessThanOrEqual(size);
      for (const control of [trigger, page.getByText(/JPEG, PNG или WebP · до 2 МиБ/), page.getByRole('button', { name: 'Удалить фото' })]) {
        expect(overlaps(avatarBox, await control.boundingBox())).toBe(false);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
});

test('avatar control fits narrow screens, long filenames and both languages', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Редактировать профиль' }).click();
  const input = page.locator('#profile-avatar');
  const trigger = page.locator('label[for="profile-avatar"]');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(trigger).toHaveText('Добавить фото');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await input.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  await expect(trigger).toHaveCSS('outline-style', 'solid');
  const longName = `${'very-long-avatar-name-'.repeat(7)}.png`;
  await input.setInputFiles({ name: longName, mimeType: 'image/png', buffer: png });
  await expect(trigger).toHaveText('Изменить фото');
  await expect(page.getByText(`Выбрано: ${longName}`)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('button', { name: 'Отмена' }).click();
  await expect(trigger).toHaveText('Добавить фото');
  await expect(page.getByText(`Выбрано: ${longName}`)).toHaveCount(0);
  await page.getByRole('button', { name: 'Меню' }).click();
  await page.getByText('EN', { exact: true }).last().click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(trigger).toHaveText('Add photo');
  await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png });
  await expect(trigger).toHaveText('Change photo');
  await expect(page.getByText('Selected: avatar.png')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('validation, cancel and unsaved navigation', async ({ page }, testInfo) => {
  await establishDefaultDemoProfile(testInfo);
  await signIn(page);
  await page.getByRole('link', { name: 'Редактировать профиль' }).click();
  const field = page.getByLabel('Имя', { exact: true });
  await field.fill('   ');
  await field.blur();
  await expect(page.getByText('Введите отображаемое имя.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toBeDisabled();
  await field.fill('New Name');
  await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Личный кабинет' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Остаться' }).click();
  await expect(field).toHaveValue('New Name');
  await page.getByRole('button', { name: 'Отмена' }).click();
  await expect(field).toHaveValue('Demo User');
  await page.getByRole('navigation', { name: 'Личный кабинет' }).getByRole('link', { name: 'Личный кабинет' }).click();
  await expect(page).toHaveURL('/account');
});

test('profile form fits responsive widths and browser Back asks before discarding edits', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Редактировать профиль' }).click();
  for (const width of [320, 390, 400, 480, 768, 769, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    await expect(page.getByRole('heading', { name: 'Личные данные', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.getByLabel('Имя', { exact: true }).fill('Changed');
  await page.evaluate(() => history.back());
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Остаться' })).toBeFocused();
  await page.getByRole('button', { name: 'Покинуть страницу' }).click();
  await expect(page).toHaveURL('/account');
});

test('account navigation and profile actions fit the shell breakpoint and mobile safe area', async ({ page }) => {
  await signIn(page);
  const navigation = page.getByRole('navigation', { name: 'Личный кабинет' });
  const title = page.getByRole('heading', { name: 'Личный кабинет' });
  await page.setViewportSize({ width: 769, height: 800 });
  expect((await navigation.boundingBox()).x).toBeLessThan((await title.boundingBox()).x);
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(page.locator('summary')).toHaveCount(0);
  expect((await title.boundingBox()).y).toBeLessThan(150);
  await page.getByRole('link', { name: 'Редактировать профиль' }).click();
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [769, 800], [1280, 900]]) {
    await page.setViewportSize({ width, height });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width <= 390) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const cancel = await page.getByRole('button', { name: 'Отмена' }).boundingBox();
      const chat = await page.getByRole('button', { name: 'Задать вопрос' }).boundingBox();
      expect(cancel.y + cancel.height).toBeLessThan(chat.y);
    }
  }
});
