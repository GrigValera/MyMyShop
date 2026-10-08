// Только публичная demo-идентичность, без доступа к защищённым ресурсам.
const DEMO_USER = Object.freeze({ id: 'demo', name: 'Demo User' });

export const demoSessionAdapter = {
  // Form values are deliberately ignored in the public demo. No credential is checked or kept.
  async signIn() {
    return this.startSession();
  },
  async signUp() {
    return { status: 'demo-only' };
  },
  async requestPasswordReset() {
    return { status: 'demo-only' };
  },
  async startSession() {
    return { status: 'demo', user: { ...DEMO_USER } };
  },
  async endSession() {
    return { status: 'anonymous', user: null };
  },
};
