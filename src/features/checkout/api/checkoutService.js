import { demoCheckoutAdapter } from './demoCheckoutAdapter';

export const checkoutService = {
  preview(items) {
    return demoCheckoutAdapter.preview(items);
  },
};
