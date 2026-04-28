import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchSaleItems } from '../../features/sale/saleSlice';
import { Card, Button } from '../../shared/ui';
import { addToCart } from '../../features/cart/store/cartSlice';
import styles from './HomePage.module.css';

const normalizeRating = (rating) => {
  if (typeof rating === 'number') return rating;
  if (rating && typeof rating === 'object') return rating.rate || rating.average || 0;
  return 0;
};

export const HomePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items: saleItems, loading, error } = useSelector((state) => state.sale);

  useEffect(() => {
    if (saleItems.length === 0 && !loading) {
      dispatch(fetchSaleItems());
    }
  }, [dispatch, saleItems.length, loading]);

  const handleAddToCart = (product, salePrice, originalPrice, discountPercent, e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(addToCart({
      product: {
        id: product.id,
        title: product.title,
        image: product.images?.[0] || product.thumbnail || '',
        category: product.category,
      },
      price: salePrice,
      originalPrice: originalPrice,
      hasDiscount: true,
      discountPercent: discountPercent,
    }));
  };

  if (loading && saleItems.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{t('common.error')}: {error}</div>;
  }

  if (!saleItems.length) {
    return null;
  }

  return (
    <div className={styles.homePage}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>{t('home.heroTitle')}</h1>
        <p className={styles.heroSubtitle}>{t('home.heroSubtitle')}</p>
      </section>

      <section className={styles.saleSection}>
        <h2 className={styles.sectionTitle}>{t('home.saleTitle')}</h2>
        <div className={styles.productsGrid}>
          {saleItems.map((product) => {
            const ratingValue = normalizeRating(product.rating);
            return (
              <Link 
                to={`/product/${product.id}`} 
                state={{ 
                  fromSale: true, 
                  salePrice: product.salePrice, 
                  originalPrice: product.originalPrice, 
                  discountPercent: product.discountPercent 
                }}
                key={`sale-${product.id}`} 
                className={styles.productLink}
              >
                <Card className={styles.productCard}>
                  <div className={styles.discountBadge}>-{product.discountPercent}%</div>
                  <div className={styles.productImage}>
                    <img 
                      src={product.images?.[0] || product.thumbnail || 'https://placehold.co/280x200?text=No+Image'} 
                      alt={product.title || 'Product image'} 
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
                    <div className={styles.priceContainer}>
                      <span className={styles.originalPrice}>${product.originalPrice}</span>
                      <span className={styles.salePrice}>${product.salePrice}</span>
                    </div>
                    <div className={styles.productFooter}>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={(e) => handleAddToCart(product, product.salePrice, product.originalPrice, product.discountPercent, e)}
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
      </section>
    </div>
  );
};