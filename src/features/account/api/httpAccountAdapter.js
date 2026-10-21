import { getInitials } from '../model/profileValidation';

let profile = Object.freeze({ id: null, displayName: 'Demo User', email: '', initials: 'DU', avatarUrl: null });
const listeners = new Set();
function publish(dto) {
  profile = Object.freeze({ ...profile, id: dto.actorId, displayName: dto.displayName ?? 'Demo User', initials: getInitials(dto.displayName ?? 'Demo User') });
  listeners.forEach(listener => listener());
  return profile;
}
async function request(method, body) {
  const response = await fetch('/api/v1/me', {
    method, credentials: 'same-origin', cache: 'no-store',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401) window.dispatchEvent(new Event('mymyshop:session-invalid'));
  if (!response.ok) throw new Error('profile unavailable');
  return publish(await response.json());
}
export const httpAccountAdapter = {
  getSnapshot: () => profile,
  setIdentity(user) { publish({ actorId: user.id, displayName: user.name }); },
  subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  reset() {
    if (profile.avatarUrl) URL.revokeObjectURL(profile.avatarUrl);
    profile = Object.freeze({ id: null, displayName: 'Demo User', email: '', initials: 'DU', avatarUrl: null });
    listeners.forEach(listener => listener());
  },
  getOverview: () => request('GET'),
  getProfile: () => request('GET'),
  async updateProfile({ displayName, avatarFile, removeAvatar }) {
    const previousUrl = profile.avatarUrl;
    const updated = await request('PATCH', { displayName });
    const avatarUrl = avatarFile ? URL.createObjectURL(avatarFile) : removeAvatar ? null : previousUrl;
    profile = Object.freeze({ ...updated, avatarUrl });
    listeners.forEach(listener => listener());
    if (previousUrl && previousUrl !== avatarUrl) URL.revokeObjectURL(previousUrl);
    return profile;
  },
};
