import { httpAccountAdapter } from './httpAccountAdapter';
import { normalizeDisplayName, validateAvatar, validateAvatarContent, validateDisplayName } from '../model/profileValidation';

const adapter = httpAccountAdapter;

async function read(method) {
  try { return { status: 'success', data: await adapter[method]() }; }
  catch { return { status: 'error', error: 'unavailable' }; }
}

export const accountService = {
  getOverview: () => read('getOverview'),
  getProfile: () => read('getProfile'),
  getSnapshot: () => adapter.getSnapshot(),
  subscribe: (listener) => adapter.subscribe(listener),
  async updateProfile({ displayName, avatarFile, removeAvatar = false }) {
    const nameError = validateDisplayName(displayName);
    let avatarError = avatarFile ? validateAvatar(avatarFile) : null;
    if (avatarFile && !avatarError) {
      try { avatarError = await validateAvatarContent(avatarFile); }
      catch { return { status: 'error', error: 'unavailable' }; }
    }
    if (nameError || avatarError || (avatarFile && removeAvatar)) {
      return { status: 'error', error: nameError || avatarError || 'invalid' };
    }
    try {
      return { status: 'success', data: await adapter.updateProfile({
        displayName: normalizeDisplayName(displayName), avatarFile, removeAvatar,
      }) };
    } catch {
      return { status: 'error', error: 'unavailable' };
    }
  },
};
