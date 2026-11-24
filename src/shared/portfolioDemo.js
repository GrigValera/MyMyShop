export const isPortfolioDemo = import.meta.env.MODE === 'creator-demo';
const sessionKey = 'mymyshop-portfolio-session';
const ordersKey = 'mymyshop-portfolio-orders';
const nameKey = 'mymyshop-portfolio-name';
const actorId = 'portfolio-browser';
export const demoProfile = () => ({ actorId, displayName: localStorage.getItem(nameKey) || 'Demo User' });
export function updateDemoProfile(name) {
  localStorage.setItem(nameKey, name);
  return demoProfile();
}
function session() {
  const active = localStorage.getItem(sessionKey) === 'active';
  return { status: active ? 'authenticated' : 'anonymous', user: active ? { id: actorId, name: demoProfile().displayName } : null, mode: active ? 'portfolio' : null, error: null, canDemoSignIn: true };
}
export const demoSessionAdapter = {
  restore: async () => session(),
  start: async ({ email, password }) => {
    if (email.toLowerCase() !== 'demo@mymyshop.dev' || password !== 'DemoShop-2026!') return { status: 'invalid_credentials' };
    localStorage.setItem(sessionKey, 'active');
    return session();
  },
  end: async () => { localStorage.removeItem(sessionKey); },
};
export function demoOrderHistory() {
  const history = JSON.parse(localStorage.getItem(ordersKey) || '[]');
  return Array.isArray(history) ? history : [];
}
export function confirmDemoOrder(cart) {
  if (!cart.length || session().status !== 'authenticated') throw new Error('Demo order unavailable');
  const items = cart.map(item => {
    const unitPriceMinor = Math.round(item.price * 100);
    return { productId: item.id, source: item.source || 'demo', titleSnapshot: item.title, imageSnapshot: item.image, quantity: item.quantity, unitPriceMinor, lineTotalMinor: unitPriceMinor * item.quantity };
  });
  const history = demoOrderHistory();
  const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);
  const order = {
    id: 'portfolio-' + crypto.randomUUID(), displayNumber: 'DEMO-' + String(history.length + 1).padStart(3, '0'),
    placedAt: new Date().toISOString(), status: 'processing', currency: 'USD', items, totals: { subtotalMinor, totalMinor: subtotalMinor },
    paymentSnapshot: { methodLabel: { ru: 'Тестовая оплата', en: 'Test payment' } },
    deliverySnapshot: { recipientLabel: { ru: 'Демонстрационный получатель', en: 'Demo recipient' }, addressLines: [], methodLabel: { ru: 'Демонстрационная доставка', en: 'Demo delivery' } },
  };
  localStorage.setItem(ordersKey, JSON.stringify([order, ...history]));
  return order;
}
