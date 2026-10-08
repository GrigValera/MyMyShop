import products from './products.snapshot.json' with { type: 'json' };
import metadata from './snapshot.metadata.json' with { type: 'json' };

// Локальный публичный каталог: полный датированный снимок товаров DummyJSON.
export const demoProducts = products.map(product => ({
  ...product,
  discountPercent: product.discountPercentage,
}));
export const demoCategories = metadata.categories.map(category => ({ slug: category, name: category }));
export const snapshotMetadata = metadata;

export const getDemoProductById = (id) => demoProducts.find(product => product.id === Number(id));
