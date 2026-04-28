import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useGetCategoriesQuery, useSearchProductsInfiniteQuery } from '../../features/products/api/productsApi';
import { Card, Button } from '../../shared/ui';
import { addToCart } from '../../features/cart/store/cartSlice';
import { useIntersectionObserver } from '../../shared/hooks/useIntersectionObserver';
import styles from './ProductsPage.module.css';

const normalizeRating = (rating) => {
  if (typeof rating === 'number') return rating;
  if (rating && typeof rating === 'object') return rating.rate || rating.average || 0;
  return 0;
};

export const ProductsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: categories = [] } = useGetCategoriesQuery();

  const {
    data: productsData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useSearchProductsInfiniteQuery({
    searchQuery: searchQuery,
  });

  const allProducts = useMemo(() => {
    return productsData?.pages?.flatMap(page => page.products) || [];
  }, [productsData]);

  const sortedProducts = useMemo(() => {
    let filtered = [...allProducts];

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (sortBy === 'asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [allProducts, selectedCategory, sortBy]);

  const loadMoreRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, { enabled: hasNextPage && !isFetchingNextPage });

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({
      product: {
        id: product.id,
        title: product.title,
        image: product.images?.[0] || product.thumbnail || '',
        category: product.category,
      },
      price: product.price,
      originalPrice: product.price,
      hasDiscount: false,
      discountPercent: 0,
    }));
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSortBy('default');
  };

  if (isLoading && allProducts.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('products.loading')}</p>
      </div>
    );
  }

  if (error && allProducts.length === 0) {
    return <div className={styles.error}>{t('common.error')}</div>;
  }

  return (
    <div className={styles.productsPage}>
      <div className={styles.searchBar}>
        <input
          type="text"
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
          <p className={styles.resultsCount}>
            {sortedProducts.length} {t('products.filtered')}
          </p>
        </div>

        <div className={styles.productsGrid}>
          {sortedProducts.map((product) => {
            const ratingValue = normalizeRating(product.rating);
            const uniqueKey = `product-${product.id}`;
            return (
              <Link 
                to={`/product/${product.id}`} 
                key={uniqueKey} 
                className={styles.productLink}
              >
                <Card className={styles.cardInner}>
                  <div className={styles.productImage}>
                    <img 
                      src={product.images?.[0] || product.thumbnail || 'https://placehold.co/280x200?text=No+Image'} 
                      alt={product.title}
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

        {hasNextPage && <div ref={loadMoreRef} className={styles.triggerElement}></div>}

        {isFetchingNextPage && (
          <div className={styles.loadingMore}>
            <div className={styles.spinnerSmall}></div>
            <p>{t('products.loading')}</p>
          </div>
        )}

        {!hasNextPage && allProducts.length > 0 && (
          <div className={styles.endMessage}>
            <p>{t('products.endMessage')}</p>
          </div>
        )}

        {sortedProducts.length === 0 && !isLoading && (
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
                className={`${styles.categoryBtn} ${selectedCategory === '' ? styles.active : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                {t('filter.all')}
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug || category}
                  className={`${styles.categoryBtn} ${selectedCategory === (category.slug || category) ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(category.slug || category)}
                >
                  {category.name || category}
                </button>
              ))}
            </div>
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