import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity } from '../../../features/cart/store/cartSlice';
import styles from './CartDrawer.module.css';

const CartDrawer = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h3>{t('cart.title')}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.content}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>{t('cart.empty')}</p>
            </div>
          ) : (
            <>
              <div className={styles.cartItems}>
                {cartItems.map((item) => {
                  const imageUrl = item.image || 'https://placehold.co/40x40?text=No+Image';
                  return (
                    <div key={`${item.id}-${item.hasDiscount}-${item.price}`} className={styles.cartItem}>
                      <img src={imageUrl} alt={item.title} className={styles.cartItemImage} />
                      <div className={styles.cartItemInfo}>
                        <p className={styles.cartItemTitle}>
                          {item.title?.length > 30 ? item.title.slice(0, 30) + '...' : item.title}
                        </p>
                        <p className={styles.cartItemPrice}>${item.price}</p>
                        {item.hasDiscount && (
                          <span className={styles.discountBadge}>-{item.discountPercent}%</span>
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
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemove(item.id, item.hasDiscount, item.price)}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className={styles.cartFooter}>
                <div className={styles.totalRow}>
                  <span>{t('cart.total')}</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className={styles.actions}>
                  <Link to="/cart" className={styles.viewCartBtn} onClick={onClose}>
                    {t('cart.viewCart')}
                  </Link>
                  <Link to="/checkout" className={styles.checkoutBtn} onClick={onClose}>
                    {t('cart.checkout')}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;