import { demoAccountAdapter } from './demoAccountAdapter';

// A future backend adapter maps its DTO into this display-safe overview shape.
const adapter = demoAccountAdapter;

export const accountService = {
  async getOverview() {
    try {
      return { status: 'success', data: await adapter.getOverview() };
    } catch {
      return { status: 'error', error: 'unavailable' };
    }
  },
};
