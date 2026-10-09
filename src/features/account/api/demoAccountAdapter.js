// Public, display-only demo fixture. It is never populated from auth forms or storage.
const DEMO_ACCOUNT = Object.freeze({
  id: 'demo',
  displayName: 'Demo User',
  email: 'demo@example.test',
  initials: 'DU',
});

export const demoAccountAdapter = {
  async getOverview() {
    return { ...DEMO_ACCOUNT };
  },
};
