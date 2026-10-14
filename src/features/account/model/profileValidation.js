export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function normalizeDisplayName(value) { return value.trim(); }

export function validateDisplayName(value) {
  const name = normalizeDisplayName(value);
  if (!name) return 'required';
  if (Array.from(name).length > MAX_DISPLAY_NAME_LENGTH) return 'tooLong';
  return null;
}

export function validateAvatar(file) {
  if (!AVATAR_TYPES.includes(file.type)) return 'unsupportedType';
  if (file.size > MAX_AVATAR_BYTES) return 'tooLarge';
  return null;
}

export async function validateAvatarContent(file) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const starts = (...values) => values.every((value, index) => bytes[index] === value);
  if (file.type === 'image/jpeg') return starts(0xff, 0xd8, 0xff) ? null : 'unsupportedType';
  if (file.type === 'image/png') return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a) ? null : 'unsupportedType';
  if (file.type === 'image/webp') return starts(0x52, 0x49, 0x46, 0x46) &&
    [8, 9, 10, 11].every((index) => bytes[index] === [0x57, 0x45, 0x42, 0x50][index - 8]) ? null : 'unsupportedType';
  return 'unsupportedType';
}

export function getInitials(name) {
  return name.trim().split(/\s+/u).slice(0, 2).map((part) => Array.from(part)[0]?.toLocaleUpperCase() ?? '').join('');
}
