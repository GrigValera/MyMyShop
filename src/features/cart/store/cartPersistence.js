export const CART_STORAGE_KEY = 'mymyshop.cart.v1';
const SCHEMA_VERSION = 1;

// Строки корзины содержат снимок товара и цены для отображения. Ограничиваем поля
// при сохранении, чтобы не записать посторонние данные Redux, авторизации и оформления.
const toCartItem = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { id, source, title, image, category, price, originalPrice, hasDiscount, discountPercent, quantity } = value;
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  if (source !== 'demo' && source !== 'api') return null;
  if (typeof title !== 'string' || !title.trim()) return null;
  if (typeof image !== 'string' || typeof category !== 'string') return null;
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(originalPrice) || originalPrice < 0) return null;
  if (typeof hasDiscount !== 'boolean' || !Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) return null;
  // Бизнес-ограничения на количество нет. Безопасные целые числа и проверка расчёта
  // ограничивают повреждённые данные, не вводя произвольный лимит покупок.
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isFinite(price * quantity) || price * quantity > Number.MAX_SAFE_INTEGER) return null;
  return { id, source, title, image, category, price, originalPrice, hasDiscount, discountPercent, quantity };
};

export const sanitizeCartItems = (values) => {
  if (!Array.isArray(values)) return [];
  const items = [];
  const positions = new Map();
  for (const value of values) {
    const item = toCartItem(value);
    if (!item) continue;
    const identity = JSON.stringify([item.id, item.source, item.hasDiscount, item.price]);
    const index = positions.get(identity);
    if (index === undefined) {
      positions.set(identity, items.length);
      items.push(item);
    } else {
      const existing = items[index];
      const quantity = existing.quantity + item.quantity;
      if (Number.isSafeInteger(quantity) && Number.isFinite(existing.price * quantity) && existing.price * quantity <= Number.MAX_SAFE_INTEGER) {
        existing.quantity = quantity;
      }
    }
  }
  return items;
};

export const loadCart = (storage) => {
  try {
    const target = storage ?? window.localStorage;
    const raw = target.getItem(CART_STORAGE_KEY);
    if (raw === null) return { items: [] };
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        data.schemaVersion !== SCHEMA_VERSION || !Array.isArray(data.items)) {
      target.removeItem(CART_STORAGE_KEY);
      return { items: [] };
    }
    const items = sanitizeCartItems(data.items);
    const canonical = JSON.stringify({ schemaVersion: SCHEMA_VERSION, items });
    try {
      if (items.length === 0) target.removeItem(CART_STORAGE_KEY);
      else if (raw !== canonical) target.setItem(CART_STORAGE_KEY, canonical);
    } catch { /* Проверенный снимок остаётся доступен в памяти. */ }
    return { items };
  } catch {
    // Доступ к хранилищу, разбор JSON и очистка могут завершиться ошибкой.
    try { (storage ?? window.localStorage).removeItem(CART_STORAGE_KEY); } catch { /* Корзина в памяти остаётся доступна. */ }
    return { items: [] };
  }
};

export const saveCart = (cart, storage) => {
  try {
    const target = storage ?? window.localStorage;
    const items = sanitizeCartItems(cart.items);
    if (items.length === 0) target.removeItem(CART_STORAGE_KEY);
    else target.setItem(CART_STORAGE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, items }));
    return true;
  } catch {
    return false;
  }
};
