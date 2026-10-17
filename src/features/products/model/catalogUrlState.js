export const MAX_CATALOG_QUERY_LENGTH = 120;

const normalizeQuery = (value = '') => {
  const trimmed = String(value).trim();
  const limited = trimmed.slice(0, MAX_CATALOG_QUERY_LENGTH);
  return /[\uD800-\uDBFF]$/.test(limited) ? limited.slice(0, -1) : limited;
};

const normalizePrice = (value) => {
  if (value === null || String(value).trim() === '') return '';
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? String(number) : '';
};

export const parseCatalogSearchParams = (search, knownCategories) => {
  const params = new URLSearchParams(search);
  const source = params.get('source') === 'api' ? 'api' : '';
  const known = knownCategories ? new Set(knownCategories) : null;
  const categories = [...new Set(params.getAll('category'))]
    .filter(category => category && (known ? known.has(category) : /^[a-z0-9-]+$/.test(category)))
    .sort();
  const sort = params.get('sort');

  return {
    q: normalizeQuery(params.get('q') || ''),
    categories,
    minPrice: normalizePrice(params.get('minPrice')),
    maxPrice: normalizePrice(params.get('maxPrice')),
    sort: sort === 'asc' || sort === 'desc' ? sort : 'default',
    source,
  };
};

export const serializeCatalogSearchParams = ({ q = '', categories = [], minPrice = '', maxPrice = '', sort = 'default', source = '' }) => {
  const params = new URLSearchParams();
  const query = normalizeQuery(q);
  if (query) params.set('q', query);
  for (const category of [...new Set(categories)].sort()) params.append('category', category);
  const min = normalizePrice(minPrice);
  const max = normalizePrice(maxPrice);
  if (min) params.set('minPrice', min);
  if (max) params.set('maxPrice', max);
  if (sort === 'asc' || sort === 'desc') params.set('sort', sort);
  if (source === 'api') params.set('source', 'api');
  return params;
};
