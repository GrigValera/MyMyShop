import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity } from '../../../features/cart/store/cartSlice';
import ProductImage from '../../../features/products/components/ProductImage';
import QuantityControls from '../../../features/cart/components/QuantityControls';
import RemoveButton from '../../../features/cart/components/RemoveButton';
import styles from './CartDrawer.module.css';

const CartDrawer = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const drawerRef = useRef(null);
  const closeRef = useRef(null);

  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleRemove = (item) => {
    dispatch(removeFromCart({ id: item.id, source: item.source || 'demo', hasDiscount: item.hasDiscount, price: item.price }));
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = [...(drawerRef.current?.querySelectorAll('button:not(:disabled), a[href]') ?? [])];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer} ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
        <div className={styles.header}>
          <h3 id="cart-drawer-title">{t('cart.title')}</h3>
          <button ref={closeRef} type="button" className={styles.closeBtn} onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        <div className={styles.content}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <h4>{t('cart.emptyTitle')}</h4>
              <p>{t('cart.emptyHint')}</p>
              <Link to="/products" className={styles.viewCartBtn} onClick={onClose}>{t('common.continue')}</Link>
            </div>
          ) : (
            <>
              <div className={styles.cartItems}>
                {cartItems.map((item) => {
                  return (
                    <div key={`${item.source || 'demo'}-${item.id}-${item.hasDiscount}-${item.price}`} className={styles.cartItem}>
                      <ProductImage className={styles.cartItemImage} src={item.image} alt={item.title} width={48} height={48} loading="eager" />
                      <div className={styles.cartItemInfo}>
                        <p className={styles.cartItemTitle}>
                          {item.title}
                        </p>
                        <p className={styles.cartItemPrice}>${item.price}</p>
                        {item.hasDiscount && (
                          <span className={styles.discountBadge}>-{item.discountPercent}%</span>
                        )}
                      </div>
                      <div className={styles.itemActions}>
                        <QuantityControls item={item} onChange={(payload) => dispatch(updateQuantity(payload))} />
                        <RemoveButton
                          item={item}
                          onClick={() => handleRemove(item)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.cartFooter}>
                <div className={styles.countRow}>
                  <span>{t('cart.itemCount')}</span>
                  <span>{cartItems.reduce((count, item) => count + item.quantity, 0)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>{t('cart.total')}</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className={styles.actions}>
                  <Link to="/cart" className={styles.viewCartBtn} onClick={onClose}>
                    {t('cart.viewCart')}
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
