import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../shared/ui';
import { removeFromCart, updateQuantity, clearCart } from '../../features/cart/store/cartSlice';
import QuantityControls from '../../features/cart/components/QuantityControls';
import RemoveButton from '../../features/cart/components/RemoveButton';
import ProductImage from '../../features/products/components/ProductImage';
import styles from './CartPage.module.css';

const CartPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const handleRemove = (item) => {
    dispatch(removeFromCart({ id: item.id, source: item.source, hasDiscount: item.hasDiscount, price: item.price }));
  };

  const handleCheckout = () => {
    console.log('Order placed:', cartItems);
    console.log('Total amount:', totalPrice);
    alert('Order placed! Check console for details.');
    dispatch(clearCart());
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.cartPage}>
        <h1>{t('cart.title')}</h1>
        <div className={styles.emptyCart}>
          <h2>{t('cart.emptyTitle')}</h2>
          <p>{t('cart.emptyHint')}</p>
          <Link to="/products" className={styles.continueLink}>{t('common.continue')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <h1>{t('cart.title')}</h1>
      <Link to="/products" className={styles.continueLink}>{t('common.continue')}</Link>
      <div className={styles.cartContent}>
        <div className={styles.cartItems}>
          {cartItems.map((item) => {
            return (
              <Card key={`${item.source || 'demo'}-${item.id}-${item.hasDiscount}-${item.price}`} className={styles.cartItem}>
                <Link
                  to={`/product/${item.id}${item.source === 'api' ? '?source=api' : ''}`}
                  state={item.hasDiscount ? {
                    fromSale: true,
                    discountPercent: item.discountPercent,
                    salePrice: item.price,
                    originalPrice: item.originalPrice,
                  } : undefined}
                  className={styles.productLink}
                  aria-label={t('cart.viewProduct', { title: item.title })}
                >
                  <ProductImage className={styles.cartItemImage} src={item.image} alt="" width={80} height={80} />
                  <div className={styles.cartItemDetails}>
                    <h3>{item.title}</h3>
                    <p className={styles.cartItemPrice}>${item.price}</p>
                    {item.hasDiscount && (
                      <p className={styles.discountBadge}>-{item.discountPercent}%</p>
                    )}
                  </div>
                </Link>
                <div className={styles.cartItemTotal}>
                  <span>{t('cart.subtotal')}</span>
                  <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                </div>
                <div className={styles.itemActions}>
                  <QuantityControls item={item} onChange={(payload) => dispatch(updateQuantity(payload))} />
                  <RemoveButton
                    item={item}
                    onClick={() => handleRemove(item)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
        <div className={styles.cartSummary}>
          <h3>{t('cart.orderSummary')}</h3>
          <div className={styles.summaryRow}>
            <span>{t('cart.itemCount')}</span>
            <span>{itemCount}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('cart.subtotal')}</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('cart.shipping')}</span>
            <span>{totalPrice > 50 ? t('cart.free') : '$5.99'}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>{t('cart.total')}</span>
            <span>${totalPrice > 50 ? totalPrice.toFixed(2) : (totalPrice + 5.99).toFixed(2)}</span>
          </div>
          <Button variant="primary" size="lg" onClick={handleCheckout} className={styles.checkoutBtn}>
            {t('cart.checkout')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
