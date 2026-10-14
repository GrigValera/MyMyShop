export const demoCheckoutAdapter = {
  preview(items) {
    return {
      status: 'unavailable',
      items,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
    };
  },
};
