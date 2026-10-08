// Удаляем только ключи авторизации от старой имитации входа.
export const LEGACY_KEYS = Object.freeze([
  'mock_users', 'mock_current_user', 'mock_token', 'auth_user', 'auth_token',
]);

export function cleanupLegacyCredentials(storage) {
  for (const key of LEGACY_KEYS) storage.removeItem(key);
}

export function cleanupBrowserCredentials() {
  let complete = true;
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      cleanupLegacyCredentials(window[name]);
    } catch {
      complete = false;
    }
  }
  return complete;
}
