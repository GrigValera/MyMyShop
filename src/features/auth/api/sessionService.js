import { cleanupBrowserCredentials } from './authService.js';
import { httpSessionAdapter } from './httpSessionAdapter.js';
import { httpAccountAdapter } from '../../account/api/httpAccountAdapter.js';

// UI получает только состояние и имя, а токен остаётся в HttpOnly cookie.
const adapter = httpSessionAdapter;

const anonymousSession = () => ({ status: 'anonymous', user: null, mode: null, error: null, canDemoSignIn: false });
const unavailable = () => ({ status: 'unavailable', user: null, mode: null, error: 'unavailable', canDemoSignIn: false });

export const sessionService = {
  getInitialSession() {
    return { status: 'loading', user: null, mode: null, error: null, canDemoSignIn: false };
  },
  async restoreSession() {
    cleanupBrowserCredentials();
    try {
      const result = await adapter.restore();
      if (result.status === 'anonymous') httpAccountAdapter.reset();
      else httpAccountAdapter.setIdentity(result.user);
      return result;
    } catch { return unavailable(); }
  },
  async startSession(credentials) {
    cleanupBrowserCredentials();
    try {
      const result = await adapter.start(credentials);
      if (result.status !== 'authenticated') return result;
      httpAccountAdapter.reset();
      httpAccountAdapter.setIdentity(result.user);
      return result;
    } catch { return unavailable(); }
  },
  async endSession() {
    try {
      await adapter.end();
      httpAccountAdapter.reset();
      return anonymousSession();
    } catch { return unavailable(); }
  },
};
