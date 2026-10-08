// Только публичная demo-идентичность, без доступа к защищённым ресурсам.
const DEMO_USER = Object.freeze({ id: 'demo', name: 'Demo User' });

export const demoSessionAdapter = {
  async startSession() {
    return { status: 'demo', user: { ...DEMO_USER } };
  },
  async endSession() {
    return { status: 'anonymous', user: null };
  },
};
