import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigationType, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetCategoriesQuery, useSearchProductsInfiniteQuery } from '../../features/products/api/productsApi';
import { Card, Button, Loader } from '../../shared/ui';
import CartProductControl from '../../features/cart/components/CartProductControl';
import { useIntersectionObserver } from '../../shared/hooks/useIntersectionObserver';
import { demoProducts, demoCategories } from '../../features/products/data/demoProducts';
import ProductImage from '../../features/products/components/ProductImage';
import { applyCatalogPipeline, normalizePriceRange } from '../../features/products/model/catalogPipeline';
import { MAX_CATALOG_QUERY_LENGTH, parseCatalogSearchParams, serializeCatalogSearchParams } from '../../features/products/model/catalogUrlState';
import styles from './ProductsPage.module.css';

const EMPTY_CATEGORIES = [];

const normalizeRating = (rating) => {
  if (typeof rating === 'number') return rating;
  if (rating && typeof rating === 'object') return rating.rate || rating.average || 0;
  return 0;
};

const ProductsPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigationType = useNavigationType();
  const [, setSearchParams] = useSearchParams();
  const isApiMode = new URLSearchParams(location.search).get('source') === 'api';
  const { data: apiCategories = EMPTY_CATEGORIES } = useGetCategoriesQuery(undefined, { skip: !isApiMode });
  const categories = isApiMode ? apiCategories : demoCategories;
  const catalogState = useMemo(() => parseCatalogSearchParams(
    location.search,
    isApiMode && apiCategories.length === 0 ? null : categories.map(category => category.slug || category),
  ), [location.search, isApiMode, apiCategories, categories]);
  const { q: appliedSearchQuery, categories: selectedCategories, minPrice, maxPrice, sort: sortBy } = catalogState;
  const pendingCatalogStateRef = useRef(catalogState);
  const pendingCanonicalRef = useRef(null);
  const [optimisticCatalog, setOptimisticCatalog] = useState(null);
  const controlState = optimisticCatalog || catalogState;
  useLayoutEffect(() => {
    const canonical = serializeCatalogSearchParams(catalogState).toString();
    if (navigationType === 'POP' || !pendingCanonicalRef.current || pendingCanonicalRef.current === canonical) {
      pendingCatalogStateRef.current = catalogState;
      pendingCanonicalRef.current = null;
    }
  }, [catalogState, navigationType]);
  const [searchDraft, setSearchDraft] = useState(null);
  const searchQuery = searchDraft?.baseQ === appliedSearchQuery ? searchDraft.value : appliedSearchQuery;
  const isSearchPending = searchQuery !== appliedSearchQuery;
  const priceEditRef = useRef(null);
  const navigationVersionRef = useRef(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const filterTriggerRef = useRef(null);
  const filterDialogRef = useRef(null);
  const filterTitleRef = useRef(null);
  const filterCloseRef = useRef(null);
  const filterApplyRef = useRef(null);

  useEffect(() => {
    if (!isDrawerOpen) return undefined;

    const dialog = filterDialogRef.current;
    const trigger = filterTriggerRef.current;
    const scrollY = window.scrollY;
    const previousBodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    dialog.showModal();
    filterTitleRef.current?.focus();
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const handleResize = () => {
      if (window.innerWidth > 768) setIsDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (dialog.open) dialog.close();
      document.body.style.position = previousBodyStyle.position;
      document.body.style.top = previousBodyStyle.top;
      document.body.style.width = previousBodyStyle.width;
      window.scrollTo(0, scrollY);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    const canonical = serializeCatalogSearchParams(catalogState).toString();
    if (location.search.slice(1) !== canonical) {
      setSearchParams(canonical, { replace: true, preventScrollReset: true });
    }
  }, [catalogState, location.search, setSearchParams]);

  useEffect(() => {
    const clearPendingSearch = () => {
      navigationVersionRef.current += 1;
      pendingCanonicalRef.current = null;
      setOptimisticCatalog(null);
      setSearchDraft(null);
    };
    window.addEventListener('popstate', clearPendingSearch);
    return () => window.removeEventListener('popstate', clearPendingSearch);
  }, []);

  useEffect(() => {
    if (!isSearchPending) return undefined;
    const navigationVersion = navigationVersionRef.current;
    const timer = window.setTimeout(() => {
      if (navigationVersionRef.current !== navigationVersion || window.location.search !== location.search) return;
      const nextState = { ...pendingCatalogStateRef.current, q: searchQuery };
      const next = serializeCatalogSearchParams(nextState);
      pendingCatalogStateRef.current = nextState;
      pendingCanonicalRef.current = next.toString();
      setSearchParams(next, { preventScrollReset: true });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [catalogState, isSearchPending, location.key, location.search, searchQuery, setSearchParams]);

  const updateCatalogState = (changes, { replace = false } = {}) => {
    const current = pendingCatalogStateRef.current;
    const nextState = { ...current, ...changes };
    const next = serializeCatalogSearchParams(nextState);
    if (next.toString() !== serializeCatalogSearchParams(current).toString()) {
      pendingCatalogStateRef.current = nextState;
      pendingCanonicalRef.current = next.toString();
      setOptimisticCatalog(nextState);
      setSearchParams(next, { replace, preventScrollReset: true });
    }
  };

  const {
    currentData: productsData,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useSearchProductsInfiniteQuery({
    searchQuery: appliedSearchQuery,
    category: selectedCategories.length === 1 ? selectedCategories[0] : '',
  }, { skip: !isApiMode || isSearchPending });

  const allProducts = useMemo(() => {
    if (isSearchPending) return [];
    return isApiMode ? productsData?.pages?.flatMap(page => page.products) || [] : demoProducts;
  }, [productsData, isSearchPending, isApiMode]);
  const isInitialLoading = isSearchPending || (isApiMode && !productsData && !error);
  const hasInitialError = isApiMode && !isSearchPending && error && !productsData && !isFetchNextPageError;

  const { products: sortedProducts, count } = useMemo(() => applyCatalogPipeline(allProducts, {
    search: isApiMode ? '' : appliedSearchQuery,
    categories: selectedCategories,
    minPrice,
    maxPrice,
    sort: sortBy,
  }), [allProducts, appliedSearchQuery, selectedCategories, minPrice, maxPrice, sortBy, isApiMode]);
  const normalizedPrice = normalizePriceRange(minPrice, maxPrice);
  const activeFilters = [
    ...(searchQuery.trim() ? [`${t('filter.search')}: ${searchQuery.trim()}`] : []),
    ...selectedCategories,
    ...(normalizedPrice.min !== null ? [`${t('filter.minPrice')}: $${normalizedPrice.min}`] : []),
    ...(normalizedPrice.max !== null ? [`${t('filter.maxPrice')}: $${normalizedPrice.max}`] : []),
    ...(sortBy !== 'default' ? [t(`filter.${sortBy}`)] : []),
  ];
  const hasQueryFilters = Boolean(searchQuery.trim() || selectedCategories.length || normalizedPrice.min !== null || normalizedPrice.max !== null);
  const showResults = !isInitialLoading && !hasInitialError;
  const showEmpty = showResults && count === 0 && (!isApiMode || !hasNextPage) && !isFetchNextPageError;
  const showEnd = showResults && isApiMode && count > 0 && !hasNextPage && !isFetchNextPageError;

  const loadMoreRef = useIntersectionObserver(() => {
    if (isApiMode && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      fetchNextPage();
    }
  }, { enabled: isApiMode && hasNextPage && !isFetchingNextPage && !isFetchNextPageError && !isInitialLoading, rootMargin: '300px' });

  const handleResetFilters = () => {
    navigationVersionRef.current += 1;
    setSearchDraft(null);
    updateCatalogState({ q: '', categories: [], minPrice: '', maxPrice: '', sort: 'default' });
  };

  const toggleCategory = (category) => {
    const current = pendingCatalogStateRef.current.categories;
    updateCatalogState({ categories: current.includes(category)
      ? current.filter(item => item !== category) : [...current, category] });
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
          maxLength={MAX_CATALOG_QUERY_LENGTH}
          onChange={(e) => setSearchDraft({ baseQ: appliedSearchQuery, value: e.target.value })}
        />
        <button 
          ref={filterTriggerRef}
          className={styles.filterBtn}
          aria-expanded={isDrawerOpen}
          aria-controls="catalog-filter-dialog"
          onClick={() => setIsDrawerOpen(true)}
        >
          {t('filter.filters')}{activeFilters.length > 0 && <><span aria-hidden="true">·</span><span className={styles.filterCount} aria-label={t('filter.activeCount', { count: activeFilters.length })}>{activeFilters.length}</span></>}
        </button>
      </div>

      <div className={styles.productsContent}>
        <div className={styles.productsHeader}>
          <h1>{t('products.title')}</h1>
          {showResults && <p className={styles.resultsCount} data-testid="results-summary">
            {count} {isApiMode ? t('products.loadedResults') : t('products.filtered')}
            {!isApiMode && hasQueryFilters && <span className={styles.resultsTotal}> {t('products.ofCatalog', { count: demoProducts.length })}</span>}
          </p>}
        </div>

        {activeFilters.length > 0 && <div className={styles.activeFilters} data-testid="active-filters">
          <span className={styles.activeLabel}>{t('filter.active')}:</span>
          <ul className={styles.activeList}>{activeFilters.map((filter, index) => <li className={styles.activeChip} key={`${filter}-${index}`}>{filter}</li>)}</ul>
          {!isDrawerOpen && !showEmpty && <button className={styles.clearFilters} onClick={handleResetFilters}>{t('filter.resetAll')}</button>}
        </div>}

        {isInitialLoading && <div role="status" aria-label={t('products.loading')}><Loader /></div>}

        {hasInitialError && (
          <div className={styles.error} role="alert">
            <p>{t('common.error')}</p>
            <Button variant="outline" size="sm" onClick={refetch}>{t('common.retry')}</Button>
          </div>
        )}

        {showResults && <div className={styles.productsGrid}>
          {sortedProducts.map((product, index) => {
            const ratingValue = normalizeRating(product.rating);
            const uniqueKey = `product-${product.id}`;
            return (
              <Card className={styles.cardInner} key={uniqueKey}>
                <Link
                  to={`/product/${product.id}${isApiMode ? '?source=api' : ''}`}
                  className={styles.productLink}
                >
                  <ProductImage
                    className={styles.productImage}
                    src={product.thumbnail || product.images?.[0]}
                    alt={product.title}
                    loading={index < 4 ? 'eager' : 'lazy'}
                  />
                  <div className={styles.productInfo}>
                    <h3 className={styles.productTitle}>
                      {product.title}
                    </h3>
                    <p className={styles.productCategory}>{product.category}</p>
                    <div className={styles.rating}>
                      {'★'.repeat(Math.floor(ratingValue))}
                      {'☆'.repeat(5 - Math.floor(ratingValue))}
                      <span className={styles.ratingValue}>({ratingValue.toFixed(1)})</span>
                    </div>
                  </div>
                </Link>
                <div className={styles.productFooter}>
                  <span className={styles.productPrice}>${product.price}</span>
                  <CartProductControl
                    item={{
                      product: { id: product.id, source: isApiMode ? 'api' : 'demo',
                        title: product.title, image: product.thumbnail || product.images?.[0] || '',
                        category: product.category },
                      price: product.price,
                      originalPrice: product.price,
                      hasDiscount: false,
                      discountPercent: 0,
                    }}
                    containerClassName={styles.addToCartAction}
                    className={`${styles.addToCartBtn} add-to-cart-btn`}
                  />
                </div>
              </Card>
            );
          })}
        </div>}

        {showResults && isApiMode && hasNextPage && !isFetchNextPageError && <div ref={loadMoreRef} className={styles.triggerElement}></div>}

        {showResults && isApiMode && isFetchingNextPage && (
          <div className={styles.loadingMore}>
            <div className={styles.spinnerSmall}></div>
            <p>{t('products.loading')}</p>
          </div>
        )}

        {showResults && isApiMode && isFetchNextPageError && (
          <div className={styles.error} role="alert">
            <p>{t('common.error')}</p>
            <Button variant="outline" size="sm" onClick={() => fetchNextPage()}>{t('common.retry')}</Button>
          </div>
        )}

        {showEnd && (
          <div className={styles.endMessage}>
            <p>{t('products.endMessage')}</p>
          </div>
        )}

        {showEmpty && (
          <div className={styles.noResults}>
            <h2>{t(hasQueryFilters ? 'products.empty' : 'products.catalogEmpty')}</h2>
            {hasQueryFilters && <>
              <p>{t('products.emptyHint')}</p>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>{t('filter.resetAll')}</Button>
            </>}
          </div>
        )}
      </div>

      {isDrawerOpen && createPortal(<dialog
        id="catalog-filter-dialog"
        ref={filterDialogRef}
        className={styles.drawer}
        aria-labelledby="catalog-filter-title"
        onCancel={(event) => { event.preventDefault(); setIsDrawerOpen(false); }}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          if (event.shiftKey && (document.activeElement === filterCloseRef.current || document.activeElement === filterTitleRef.current)) {
            event.preventDefault();
            filterApplyRef.current?.focus();
          } else if (!event.shiftKey && document.activeElement === filterApplyRef.current) {
            event.preventDefault();
            filterCloseRef.current?.focus();
          }
        }}
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            setIsDrawerOpen(false);
          }
        }}
      >
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeading}>
            <h3 id="catalog-filter-title" ref={filterTitleRef} tabIndex={-1}>{t('filter.filters')}</h3>
            <span className={styles.drawerCount} aria-label={t('filter.activeCount', { count: activeFilters.length })}>{activeFilters.length}</span>
          </div>
          <button ref={filterCloseRef} className={styles.closeBtn} aria-label={t('common.close')} onClick={() => setIsDrawerOpen(false)}>✕</button>
        </div>
        <div className={styles.drawerContent}>
          <div className={styles.filterSection}>
            <h4>{t('filter.category')}</h4>
            <div className={styles.categoryList}>
              <button
                className={`${styles.categoryBtn} ${controlState.categories.length === 0 ? styles.active : ''}`}
                aria-pressed={controlState.categories.length === 0}
                onClick={() => updateCatalogState({ categories: [] })}
              >
                {t('filter.all')}
              </button>
              {categories.map((category) => (
                <button
                  key={category.slug || category}
                  className={`${styles.categoryBtn} ${controlState.categories.includes(category.slug || category) ? styles.active : ''}`}
                  aria-pressed={controlState.categories.includes(category.slug || category)}
                  onClick={() => toggleCategory(category.slug || category)}
                >
                  {category.name || category}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterSection}>
            <h4>{t('filter.priceRange')}</h4>
            <div className={styles.priceFields}>
              <label className={styles.priceField}>{t('filter.minPrice')}
                <input type="number" inputMode="decimal" min="0" step="any" value={controlState.minPrice} onFocus={() => { priceEditRef.current = null; }} onBlur={() => { priceEditRef.current = null; }} onChange={e => { updateCatalogState({ minPrice: e.target.value }, { replace: priceEditRef.current === 'minPrice' }); priceEditRef.current = 'minPrice'; }} />
              </label>
              <label className={styles.priceField}>{t('filter.maxPrice')}
                <input type="number" inputMode="decimal" min="0" step="any" value={controlState.maxPrice} onFocus={() => { priceEditRef.current = null; }} onBlur={() => { priceEditRef.current = null; }} onChange={e => { updateCatalogState({ maxPrice: e.target.value }, { replace: priceEditRef.current === 'maxPrice' }); priceEditRef.current = 'maxPrice'; }} />
              </label>
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
                  checked={controlState.sort === 'default'}
                  onChange={() => updateCatalogState({ sort: 'default' })}
                />
                <span>{t('filter.default')}</span>
              </label>
              <label className={styles.sortLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="asc"
                  checked={controlState.sort === 'asc'}
                  onChange={() => updateCatalogState({ sort: 'asc' })}
                />
                <span>{t('filter.asc')}</span>
              </label>
              <label className={styles.sortLabel}>
                <input
                  type="radio"
                  name="sort"
                  value="desc"
                  checked={controlState.sort === 'desc'}
                  onChange={() => updateCatalogState({ sort: 'desc' })}
                />
                <span>{t('filter.desc')}</span>
              </label>
            </div>
          </div>
          {activeFilters.length > 0 && <div className={styles.drawerSelection} data-testid="drawer-active-filters">
            <p className={styles.drawerSelectionTitle}>{t('filter.active')} ({activeFilters.length})</p>
            <ul className={styles.activeList}>{activeFilters.map((filter, index) => <li className={styles.activeChip} key={`${filter}-${index}`}>{filter}</li>)}</ul>
          </div>}
          <div className={styles.drawerFooter}>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              {t('filter.resetAll')}
            </Button>
            <Button ref={filterApplyRef} variant="primary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              {t('filter.apply')}
            </Button>
          </div>
        </div>
      </dialog>, document.body)}
    </div>
  );
};

export default ProductsPage;
