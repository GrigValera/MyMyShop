export const formatOrderDate = (value, language) => new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ru-RU', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
}).format(new Date(value));

export const formatOrderMoney = (minor, currency, language) => new Intl.NumberFormat(language === 'en' ? 'en-US' : 'ru-RU', {
  style: 'currency', currency,
}).format(minor / 100);

export const countOrderItems = (order) => order.items.reduce((sum, item) => sum + item.quantity, 0);

export const orderSnapshotLabel = (value, language) => value[language === 'en' ? 'en' : 'ru'];
