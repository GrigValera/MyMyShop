import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useGetCategoriesQuery, useSearchProductsInfiniteQuery } from '../../features/products/api/productsApi';
import { Card, Button, Loader } from '../../shared/ui';
import { addToCart } from '../../features/cart/store/cartSlice';
import { useIntersectionObserver } from '../../shared/hooks/useIntersectionObserver';
import { demoProducts, demoCategories } from '../../features/products/data/demoProducts';
import { showUnavailableProductImage, unavailableProductImage } from '../../features/products/components/productImageFallback';
import { applyCatalogPipeline, normalizePriceRange } from '../../features/products/model/catalogPipeline';
import styles from './ProductsPage.module.css';

const normalizeRating = (rating) => {
  if (typeof rating === 'number') return rating;
  if (rating && typeof rating === 'object') return rating.rate || rating.average || 0;
  return 0;
};

const ProductsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const isApiMode = new URLSearchParams(location.search).get('source') === 'api';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isSearchPending = searchQuery.trim() !== debouncedSearchQuery;

  const { data: apiCategories = [] } = useGetCategoriesQuery(undefined, { skip: !isApiMode });
  const categories = isApiMode ? apiCategories : demoCategories;

  const {
    currentData: productsData,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useSearchProductsInfiniteQuery({
    searchQuery: debouncedSearchQuery,
    category: selectedCategories.length === 1 ? selectedCategories[0] : '',
  }, { skip: !isApiMode || isSearchPending });

  const allProducts = useMemo(() => {
    if (isSearchPending) return [];
    return isApiMode ? productsData?.pages?.flatMap(page => page.products) || [] : demoProducts;
  }, [productsData, isSearchPending, isApiMode]);
  const isInitialLoading = isSearchPending || (isApiMode && isFetching && !productsData);

  const { products: sortedProducts, count } = useMemo(() => applyCatalogPipeline(allProducts, {
    search: isApiMode ? '' : debouncedSearchQuery,
    categories: selectedCategories,
    minPrice,
    maxPrice,
    sort: sortBy,
  }), [allProducts, debouncedSearchQuery, selectedCategories, minPrice, maxPrice, sortBy, isApiMode]);
  const normalizedPrice = normalizePriceRange(minPrice, maxPrice);
  const activeFilters = [
    ...(searchQuery.trim() ? [`${t('filter.search')}: ${searchQuery.trim()}`] : []),
    ...selectedCategories,
    ...(normalizedPrice.min !== null ? [`${t('filter.minPrice')}: $${normalizedPrice.min}`] : []),
    ...(normalizedPrice.max !== null ? [`${t('filter.maxPrice')}: $${normalizedPrice.max}`] : []),
    ...(sortBy !== 'default' ? [t(`filter.${sortBy}`)] : []),
  ];

  const loadMoreRef = useIntersectionObserver(() => {
    if (isApiMode && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      fetchNextPage();
    }
  }, { enabled: isApiMode && hasNextPage && !isFetchingNextPage && !isFetchNextPageError && !isInitialLoading });

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({
      product: {
        id: product.id,
        title: product.title,
        image: product.thumbnail || product.images?.[0] || '',
        category: product.category,
      },
      price: product.price,
      originalPrice: product.price,
      hasDiscount: false,
      discountPercent: 0,
    }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
  };

  const toggleCategory = (category) => {
    setSelectedCategories(current => current.includes(category)
      ? current.filter(item => item !== category) : [...current, category]);
  };

  return (
    <div className={styles.productsPage}>
      <div className={styles.searchBar}>
        <input
          type="text"
          aria-label={t('filter.search')}
          className={styles.searchInput}
          placeholder={t('filter.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button 
          className={styles.filterBtn}
          onClick={() => setIsDrawerOpen(true)}
        >
          {t('filter.filters')}
        </button>
      </div>

      <div className={styles.productsContent}>
        <div className={styles.productsHeader}>
          <h1>{t('products.title')}</h1>
          <p className={styles.resultsCount} aria-live="polite">
            {count} {isApiMode ? t('products.loadedResults') : t('products.filtered')}
          </p>
        </div>

        <p className={styles.resultsCount}>{t(isApiMode ? 'products.apiSource' : 'products.demoSource')}</p>
        <p className={styles.resultsCount} data-testid="active-filters">
          {t('filter.active')}: {activeFilters.length ? activeFilters.join(', ') : t('filter.none')}
        </p>

        {isInitialLoading && <div role="status" aria-label={t('products.loading')}><Loader /></div>}

        {isApiMode && !isSearchPending && error && !isFetchNextPageError && (
          <div className={styles.error} role="alert">
            <p>{t('common.error')}</p>
            <Button variant="outline" size="sm" onClick={refetch}>{t('common.retry')}</Button>
          </div>
        )}

        <div className={styles.productsGrid}>
          {sortedProducts.map((product) => {
            const ratingValue = normalizeRating(product.rating);
            const uniqueKey = `product-${product.id}`;
            return (
              <Link 
                to={`/product/${product.id}${isApiMode ? '?source=api' : ''}`}
                key={uniqueKey} 
                className={styles.productLink}
              >
                <Card className={styles.cardInner}>
                  <div className={styles.productImage}>
                    <img 
                      src={product.thumbnail || product.images?.[0] || unavailableProductImage}
                      alt={product.title}
                      onError={showUnavailableProductImage}
                    />
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productTitle}>
                      {product.title?.length > 50 ? product.title.slice(0, 50) + '...' : product.title}
                    </h3>
                    <p className={styles.productCategory}>{product.category}</p>
                    <div className={styles.rating}>
                      {'★'.repeat(Math.floor(ratingValue))}
                      {'☆'.repeat(5 - Math.floor(ratingValue))}
                      <span className={styles.ratingValue}>({ratingValue.toFixed(1)})</span>
                    </div>
                    <div className={styles.productFooter}>
                      <span className={styles.productPrice}>${product.price}</span>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={(e) => handleAddToCart(product, e)}
                        className={`${styles.addToCartBtn} add-to-cart-btn`}
                      >
                        {t('product.addToCart')}
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {isApiMode && hasNextPage && !isFetchNextPageError && !isInitialLoading && <div ref={loadMoreRef} className={styles.triggerElement}></div>}

        {isApiMode && isFetchingNextPage && (
          <div className={styles.loadingMore}>
            <div className={styles.spinnerSmall}></div>
            <p>{t('products.loading')}</p>
          </div>
        )}

        {isApiMode && isFetchNextPageError && (
          <div className={styles.error} role="alert">
            <p>{t('common.error')}</p>
            <Button variant="outline" size="sm" onClick={() => fetchNextPage()}>{t('common.retry')}</Button>
          </div>
        )}

        {isApiMode && !hasNextPage && allProducts.length > 0 && (
          <div className={styles.endMessage}>
            <p>{t('products.endMessage')}</p>
          </div>
        )}

        {count === 0 && !isInitialLoading && (!isApiMode || !error) && (
          <div className={styles.noResults}>
            <p>{t('products.empty')}</p>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              {t('filter.resetAll')}
            </Button>
          </div>
        )}
      </div>

      <div className={`${styles.drawer} ${isDrawerOpen ? styles.open : ''}`}>
        <div className={styles.drawerHeader}>
          <h3>{t('filter.filters')}</h3>
          <button className={styles.closeBtn} onClick={() => setIsDrawerOpen(false)}>✕</button>
        </div>
        <div className={styles.drawerContent}>
          <div className={styles.filterSection}>
            <h4>{t('filter.category')}</h4>
            <div className={styles.categoryList}>
              <button
                className={`${styles.categoryBtn} ${selectedCategories.length === 0 ? styles.active : ''}`}
                aria-pressed={selectedCategories.length === 0}
                onClick={() => setSelectedCategories([])}
              >
                {t('filter.all')}
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug || category}
                  className={`${styles.categoryBtn} ${selectedCategories.includes(category.slug || category) ? styles.active : ''}`}
                  aria-pressed={selectedCategories.includes(category.slug || category)}
                  onClick={() => toggleCategory(category.slug || category)}
                >
                  {category.name || category}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterSection}>
            <h4>{t('filter.priceRange')}</h4>
            <label>{t('filter.minPrice')}
              <input type="number" min="0" step="any" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            </label>
            <label>{t('filter.maxPrice')}
              <input type="number" min="0" step="any" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </label>
          </div>
          <div className={styles.filterSection}>
            <h4>{t('filter.sort')}</h4>
            <div className={styles.sortOptions}>
              <label className={styles.sortLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="default"
                  checked={sortBy === 'default'}
                  onChange={() => setSortBy('default')}
                />
                <span>{t('filter.default')}</span>
              </label>
              <label className={styles.sortLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="asc"
                  checked={sortBy === 'asc'}
                  onChange={() => setSortBy('asc')}
                />
                <span>{t('filter.asc')}</span>
              </label>
              <label className={styles.sortLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="desc"
                  checked={sortBy === 'desc'}
                  onChange={() => setSortBy('desc')}
                />
                <span>{t('filter.desc')}</span>
              </label>
            </div>
          </div>
          <div className={styles.drawerFooter}>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              {t('filter.resetAll')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              {t('filter.apply')}
            </Button>
          </div>
        </div>
      </div>
      
      {isDrawerOpen && (
        <div className={styles.overlay} onClick={() => setIsDrawerOpen(false)}></div>
      )}
    </div>
  );
};

export default ProductsPage;
