import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card } from '../../shared/ui';
import { removeFromCart, updateQuantity, clearCart } from '../../features/cart/store/cartSlice';
import styles from './CartPage.module.css';

export const CartPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleRemove = (id, hasDiscount, price) => {
    dispatch(removeFromCart({ id, hasDiscount, price }));
  };

  const handleQuantityChange = (id, hasDiscount, price, quantity) => {
    if (quantity < 1) {
      handleRemove(id, hasDiscount, price);
    } else {
      dispatch(updateQuantity({ id, hasDiscount, price, quantity }));
    }
  };

  const handleCheckout = () => {
    console.log('Order placed:', cartItems);
    console.log('Total amount:', totalPrice);
    alert('Order placed! Check console for details.');
    dispatch(clearCart());
  };

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <h1>{t('cart.title')}</h1>
        <p>{t('cart.empty')}</p>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <h1>{t('cart.title')}</h1>
      <div className={styles.cartContent}>
        <div className={styles.cartItems}>
          {cartItems.map((item) => {
            const imageUrl = item.image || 'https://placehold.co/80x80?text=No+Image';
            return (
              <Card key={`${item.id}-${item.hasDiscount}-${item.price}`} className={styles.cartItem}>
                <div className={styles.cartItemImage}>
                  <img 
                    src={imageUrl}
                    alt={item.title}
                    loading="lazy"
                    width="80"
                    height="80"
                    style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                  />
                </div>
                <div className={styles.cartItemDetails}>
                  <h3>{item.title?.length > 50 ? item.title.slice(0, 50) + '...' : item.title}</h3>
                  <p className={styles.cartItemPrice}>${item.price}</p>
                  {item.hasDiscount && (
                    <p className={styles.discountBadge}>-{item.discountPercent}%</p>
                  )}
                </div>
                <div className={styles.cartItemQuantity}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, item.hasDiscount, item.price, parseInt(e.target.value))}
                    className={styles.quantityInput}
                  />
                </div>
                <div className={styles.cartItemTotal}>
                  <p>${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemove(item.id, item.hasDiscount, item.price)}
                >
                  {t('cart.remove')}
                </Button>
              </Card>
            );
          })}
        </div>
        <div className={styles.cartSummary}>
          <h3>{t('cart.orderSummary')}</h3>
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