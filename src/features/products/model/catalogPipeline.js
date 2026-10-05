const parseBound = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

export const normalizePriceRange = (min, max) => ({
  min: parseBound(min),
  max: parseBound(max),
});

export const applyCatalogPipeline = (products, {
  search = '', categories = [], minPrice = '', maxPrice = '', sort = 'default',
} = {}) => {
  const term = search.trim().toLocaleLowerCase();
  const selected = new Set(categories);
  const { min, max } = normalizePriceRange(minPrice, maxPrice);
  const results = products
    .filter(product => !term || `${product.title} ${product.description || ''}`.toLocaleLowerCase().includes(term))
    .filter(product => selected.size === 0 || selected.has(product.category))
    .filter(product => (min === null || product.price >= min) && (max === null || product.price <= max))
    .map((product, index) => ({ product, index }));

  if (sort === 'asc' || sort === 'desc') {
    const direction = sort === 'asc' ? 1 : -1;
    results.sort((a, b) => direction * (a.product.price - b.product.price) || a.index - b.index);
  }

  return { products: results.map(({ product }) => product), count: results.length };
};
