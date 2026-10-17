import { demoOrderAdapter } from './demoOrderAdapter';

const adapter = demoOrderAdapter;

export const orderService = {
  async listOrders() {
    try { return { status: 'success', data: await adapter.listOrders() }; }
    catch { return { status: 'error', error: 'unavailable' }; }
  },
  async getOrder(id) {
    try {
      const data = await adapter.getOrder(id);
      return data ? { status: 'success', data } : { status: 'not-found' };
    } catch { return { status: 'error', error: 'unavailable' }; }
  },
};
