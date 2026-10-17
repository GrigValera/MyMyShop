const item = (productId, titleSnapshot, imageSnapshot, unitPriceMinor, quantity) => ({
  productId,
  source: 'demo',
  titleSnapshot,
  imageSnapshot,
  unitPriceMinor,
  quantity,
  lineTotalMinor: unitPriceMinor * quantity,
});

const order = ({ id, displayNumber, placedAt, status, items }) => {
  const subtotalMinor = items.reduce((sum, entry) => sum + entry.lineTotalMinor, 0);
  return {
    id, displayNumber, placedAt, status, currency: 'USD', items,
    totals: { subtotalMinor, totalMinor: subtotalMinor },
    deliverySnapshot: {
      recipientLabel: { ru: 'Демонстрационный получатель', en: 'Sample recipient' },
      addressLines: ['12 Example Street', 'Sample City'],
      methodLabel: { ru: 'Стандартная доставка', en: 'Standard delivery' },
    },
    paymentSnapshot: { methodLabel: { ru: 'Демонстрационный способ', en: 'Sample payment method' } },
  };
};

export const demoOrders = [
  order({
    id: 'demo-2026-103', displayNumber: 'MS-2026-103', placedAt: '2026-08-14T12:00:00Z', status: 'processing',
    items: [item(3, 'Powder Canister', 'https://cdn.dummyjson.com/product-images/beauty/powder-canister/thumbnail.webp', 1499, 1)],
  }),
  order({
    id: 'demo-2026-102', displayNumber: 'MS-2026-102', placedAt: '2026-06-22T12:00:00Z', status: 'delivered',
    items: [
      item(1, 'Essence Mascara Lash Princess', 'https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp', 999, 2),
      item(2, 'Eyeshadow Palette with Mirror', 'https://cdn.dummyjson.com/product-images/beauty/eyeshadow-palette-with-mirror/thumbnail.webp', 1999, 1),
    ],
  }),
  order({
    id: 'demo-2026-101', displayNumber: 'MS-2026-101', placedAt: '2026-03-09T12:00:00Z', status: 'cancelled',
    items: [item(4, 'Red Lipstick', 'https://cdn.dummyjson.com/product-images/beauty/red-lipstick/thumbnail.webp', 1299, 1)],
  }),
];
