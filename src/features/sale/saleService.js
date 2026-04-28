const SALE_STORAGE_KEY = 'sale_session';
const SALE_ITEMS_COUNT = 8;

const discountOptions = [15, 20, 25, 30, 40, 50];

const getRandomDiscount = () => {
  const randomIndex = Math.floor(Math.random() * discountOptions.length);
  return discountOptions[randomIndex];
};

const normalizeRating = (rating) => {
  if (typeof rating === 'number') return rating;
  if (rating && typeof rating === 'object') return rating.rate || rating.average || 0;
  return 0;
};

const normalizeCategory = (category) => {
  if (typeof category === 'string') return category;
  if (category && typeof category === 'object') return category.name || category.slug || 'uncategorized';
  return 'uncategorized';
};

export const loadSaleItems = async () => {
  const saved = localStorage.getItem(SALE_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const now = Date.now();
      if (parsed.timestamp && (now - parsed.timestamp) < 24 * 60 * 60 * 1000) {
        if (parsed.items && parsed.items.length > 0) {
          return parsed.items;
        }
      }
    } catch (e) {
      console.error('Failed to parse sale session', e);
    }
  }
  
  try {
    const response = await fetch('https://dummyjson.com/products?limit=100&select=id,title,price,images,thumbnail,category,rating');
    const data = await response.json();
    const allProducts = data.products || [];
    
    if (!allProducts.length) {
      return [];
    }
    
    const shuffled = [...allProducts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const randomProducts = shuffled.slice(0, SALE_ITEMS_COUNT);
    
    const saleItems = randomProducts.map(product => {
      const normalizedRating = normalizeRating(product.rating);
      const normalizedCategory = normalizeCategory(product.category);
      return {
        id: product.id,
        title: product.title || 'Product',
        thumbnail: product.thumbnail || 'https://placehold.co/200x200?text=No+Image',
        images: product.images || [],
        category: normalizedCategory,
        rating: normalizedRating,
        discountPercent: getRandomDiscount(),
        originalPrice: product.price,
        salePrice: +(product.price * (1 - getRandomDiscount() / 100)).toFixed(2),
      };
    });
    
    localStorage.setItem(SALE_STORAGE_KEY, JSON.stringify({
      items: saleItems,
      timestamp: Date.now(),
    }));
    
    return saleItems;
  } catch (error) {
    console.error('Failed to load sale items:', error);
    return [];
  }
};

export const clearSaleSession = () => {
  localStorage.removeItem(SALE_STORAGE_KEY);
};