import { getInitials } from '../model/profileValidation';

// This fixture belongs to the current JavaScript runtime, never browser storage.
let profile = Object.freeze({
  id: 'demo', displayName: 'Demo User', email: 'demo@example.test',
  initials: 'DU', avatarUrl: null,
});
const listeners = new Set();

export const demoAccountAdapter = {
  getSnapshot: () => profile,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  async getOverview() { return { ...profile }; },
  async getProfile() { return { ...profile }; },
  async updateProfile({ displayName, avatarFile, removeAvatar = false }) {
    const previousUrl = profile.avatarUrl;
    const avatarUrl = avatarFile ? URL.createObjectURL(avatarFile) : removeAvatar ? null : previousUrl;
    profile = Object.freeze({ ...profile, displayName, initials: getInitials(displayName), avatarUrl });
    listeners.forEach((listener) => listener());
    if (previousUrl && previousUrl !== avatarUrl) URL.revokeObjectURL(previousUrl);
    return { ...profile };
  },
};
