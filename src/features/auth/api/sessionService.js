import { cleanupBrowserCredentials } from './authService.js';
import { demoSessionAdapter } from './demoSessionAdapter.js';

// Контракт сессии: { status: 'anonymous' | 'demo', user: null | { id, name },
// cleanupFailed: boolean, error: null | 'unavailable' }.
// Здесь backend-адаптер преобразует свой DTO в безопасную для отображения форму.
const adapter = demoSessionAdapter;

const anonymousSession = (cleanupFailed = false, error = null) => ({
  status: 'anonymous', user: null, cleanupFailed, error,
});

export const sessionService = {
  getInitialSession() {
    return anonymousSession();
  },
  restoreSession() {
    return anonymousSession(!cleanupBrowserCredentials());
  },
  async startSession() {
    return this.signIn();
  },
  async signIn(input) {
    if (!cleanupBrowserCredentials()) return anonymousSession(true);
    try {
      // A future adapter may use the form input; the demo adapter discards it.
      const session = input ? await adapter.signIn(input) : await adapter.startSession();
      return {
        status: session.status,
        user: session.user && { id: session.user.id, name: session.user.name },
        cleanupFailed: false,
        error: null,
      };
    } catch {
      return anonymousSession(false, 'unavailable');
    }
  },
  async signUp(input) {
    return adapter.signUp(input);
  },
  async requestPasswordReset(input) {
    return adapter.requestPasswordReset(input);
  },
  async endSession() {
    const cleanupFailed = !cleanupBrowserCredentials();
    try {
      await adapter.endSession();
      return anonymousSession(cleanupFailed);
    } catch {
      return anonymousSession(cleanupFailed, 'unavailable');
    }
  },
};
