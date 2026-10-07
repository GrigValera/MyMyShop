import { useLayoutEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useGetProductByIdQuery } from '../../features/products/api/productsApi';
import { getDemoProductById } from '../../features/products/data/demoProducts';
import ProductImage from '../../features/products/components/ProductImage';
import { Button, Loader } from '../../shared/ui';
import { addToCart } from '../../features/cart/store/cartSlice';
import styles from './ProductDetailsPage.module.css';

const ImageCarousel = ({ images, title }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const displayImages = images.length ? images : [''];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className={styles.carousel}>
      {displayImages.length > 1 && <button type="button" className={styles.carouselBtn} onClick={prevSlide} aria-label={t('product.previousImage')}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>}
      <ProductImage
        key={displayImages[currentIndex]}
        className={styles.imageSlot}
        src={displayImages[currentIndex]}
        alt={`${title} - ${currentIndex + 1}`}
        width={400}
        height={400}
        loading="eager"
      />
      {displayImages.length > 1 && <button type="button" className={styles.carouselBtn} onClick={nextSlide} aria-label={t('product.nextImage')}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
      </button>}
      {displayImages.length > 1 && <div className={styles.carouselDots}>
        {displayImages.map((_, idx) => (
          <button
            type="button"
            key={idx}
            className={`${styles.dot} ${idx === currentIndex ? styles.active : ''}`}
            aria-label={t('product.showImage', { number: idx + 1 })}
            aria-current={idx === currentIndex ? 'true' : undefined}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>}
    </div>
  );
};

const Reviews = ({ reviews }) => {
  const { t } = useTranslation();
  
  if (!reviews || reviews.length === 0) {
    return (
      <div className={styles.reviews}>
        <h3>{t('product.reviews')} (0)</h3>
        <p className={styles.noReviews}>{t('product.noReviews')}</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.reviews}>
      <h3>{t('product.reviews')} ({reviews.length})</h3>
      <div className={styles.reviewsList}>
        {reviews.map((review, index) => (
          <div key={index} className={styles.reviewItem}>
            <div className={styles.reviewHeader}>
              <span className={styles.reviewAuthor}>{review.reviewerName}</span>
              <span className={styles.reviewRating}>
                {'★'.repeat(Math.floor(review.rating))}
                {'☆'.repeat(5 - Math.floor(review.rating))}
              </span>
              <span className={styles.reviewDate}>{formatDate(review.date)}</span>
            </div>
            <p className={styles.reviewComment}>{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isApiMode = new URLSearchParams(location.search).get('source') === 'api';

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [id, isApiMode]);

  const { data: apiProduct, isLoading, error } = useGetProductByIdQuery(id, { skip: !isApiMode });
  const product = isApiMode ? apiProduct : getDemoProductById(id);

  const saleInfo = location.state || {};
  const hasDiscount = saleInfo.fromSale || false;
  const discountPercent = saleInfo.discountPercent || 0;
  const salePrice = saleInfo.salePrice || null;
  const originalPriceFromState = saleInfo.originalPrice || null;

  const displayPrice = hasDiscount && salePrice ? salePrice : product?.price;
  const displayOriginalPrice = hasDiscount && originalPriceFromState ? originalPriceFromState : product?.price;
  const showDiscount = hasDiscount && discountPercent > 0;

  const handleAddToCart = () => {
    if (product) {
      dispatch(addToCart({
        product: {
          id: product.id,
          source: isApiMode ? 'api' : 'demo',
          title: product.title,
          image: product.images?.[0] || product.thumbnail || '',
          category: product.category,
        },
        price: displayPrice,
        originalPrice: displayOriginalPrice,
        hasDiscount: showDiscount,
        discountPercent: discountPercent,
      }));
    }
  };

  if (isLoading) {
    return <Loader fullPage />;
  }

  if (error || !product) {
    return (
      <div className={styles.error}>
        <p>{t('common.error')}</p>
        <Button onClick={() => navigate('/products')}>{t('button.back')}</Button>
      </div>
    );
  }

  const productImages = product.images?.length ? product.images : (product.thumbnail ? [product.thumbnail] : []);

  return (
    <div className={styles.productDetailsPage}>
      <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7" />
          <path d="M5 12h14" />
        </svg>
        <span>{t('button.back')}</span>
      </button>
      
      <div className={styles.productContent}>
        <div className={styles.productGallery}>
          <ImageCarousel images={productImages} title={product.title} />
        </div>
        
        <div className={styles.productInfo}>
          <h1>{product.title}</h1>
          <p className={styles.productCategory}>{product.category}</p>
          <div className={styles.rating}>
            {'★'.repeat(Math.floor(product.rating || 0))}
            {'☆'.repeat(5 - Math.floor(product.rating || 0))}
            <span className={styles.ratingValue}>({product.rating || 0})</span>
          </div>
          <p className={styles.productDescription}>{product.description}</p>
          <div className={styles.priceContainer}>
            {showDiscount ? (
              <>
                <span className={styles.originalPrice}>${displayOriginalPrice}</span>
                <span className={styles.salePrice}>${displayPrice}</span>
                <span className={styles.discountBadge}>-{discountPercent}%</span>
              </>
            ) : (
              <span className={styles.productPrice}>${displayPrice}</span>
            )}
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleAddToCart}
            className={styles.addToCartBtn}
          >
            {t('product.addToCart')}
          </Button>
        </div>
      </div>
      
      <div className={styles.productDetails}>
        <div className={styles.detailsSection}>
          <h3>{t('product.specifications')}</h3>
          <ul>
            <li><strong>Бренд:</strong> {product.brand || 'MyMy Shop'}</li>
            <li><strong>SKU:</strong> {product.sku || `SKU-${product.id}`}</li>
            <li><strong>В наличии:</strong> {product.stock || 100} шт.</li>
          </ul>
        </div>
        
        <Reviews reviews={product.reviews} />
      </div>
    </div>
  );
};

export default ProductDetailsPage;
