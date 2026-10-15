// Только публичная demo-идентичность, без доступа к защищённым ресурсам.
const DEMO_USER = Object.freeze({ id: 'demo', name: 'Demo User' });

export const demoSessionAdapter = {
  // В публичной demo-версии данные формы намеренно игнорируются: учётные данные не проверяются и не сохраняются.
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
