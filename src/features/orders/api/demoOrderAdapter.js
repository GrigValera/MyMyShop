import { demoOrders } from '../data/demoOrders';

export const demoOrderAdapter = {
  async listOrders() { return demoOrders; },
  async getOrder(id) { return demoOrders.find((order) => order.id === id) ?? null; },
};
