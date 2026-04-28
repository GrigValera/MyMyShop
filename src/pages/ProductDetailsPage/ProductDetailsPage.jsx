import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useGetProductByIdQuery } from '../../features/products/api/productsApi';
import { Button } from '../../shared/ui';
import { addToCart } from '../../features/cart/store/cartSlice';
import styles from './ProductDetailsPage.module.css';

const ImageCarousel = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  let displayImages = [...images];
  if (!displayImages || displayImages.length === 0) {
    displayImages = ['https://placehold.co/400x400?text=No+Image'];
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className={styles.carousel}>
      <button className={styles.carouselBtn} onClick={prevSlide}>❮</button>
      <img 
        src={displayImages[currentIndex]} 
        alt={`${title} - ${currentIndex + 1}`}
      />
      <button className={styles.carouselBtn} onClick={nextSlide}>❯</button>
      <div className={styles.carouselDots}>
        {displayImages.map((_, idx) => (
          <span
            key={idx}
            className={`${styles.dot} ${idx === currentIndex ? styles.active : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
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

export const ProductDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: product, isLoading, error } = useGetProductByIdQuery(id);

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
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('common.loading')}</p>
      </div>
    );
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
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← {t('button.back')}
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