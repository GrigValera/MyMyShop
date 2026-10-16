import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/ui';
import { addToCart, decreaseProductQuantity, selectCartProductQuantity } from '../store/cartSlice';
import QuantityStepIcon from './QuantityStepIcon';
import styles from './CartProductControl.module.css';

const CartProductControl = ({ item, size = 'sm', variant = 'card', className = '', containerClassName = '' }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const store = useStore();
  const quantity = useSelector(state => selectCartProductQuantity(state, item));
  const [announcement, setAnnouncement] = useState('');
  const timeout = useRef(null);
  const pendingFocus = useRef(null);
  const addRef = useRef(null);
  const minusRef = useRef(null);
  const plusRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timeout.current), []);
  useLayoutEffect(() => {
    if (pendingFocus.current === 'add' && quantity === 0) addRef.current?.focus({ preventScroll: true });
    if (pendingFocus.current === 'minus' && quantity > 0) minusRef.current?.focus({ preventScroll: true });
    if (pendingFocus.current === 'plus' && quantity > 0) plusRef.current?.focus({ preventScroll: true });
    pendingFocus.current = null;
  }, [quantity]);

  const announce = (key, count) => {
    setAnnouncement(t(key, { title: item.product.title, count }));
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setAnnouncement(''), 3000);
  };

  const increase = (event) => {
    event.preventDefault();
    event.stopPropagation();
    pendingFocus.current = 'plus';
    dispatch(addToCart(item));
    announce('cartFeedback.addedStatus', selectCartProductQuantity(store.getState(), item));
  };

  const decrease = (event) => {
    event.preventDefault();
    event.stopPropagation();
    pendingFocus.current = selectCartProductQuantity(store.getState(), item) === 1 ? 'add' : 'minus';
    dispatch(decreaseProductQuantity(item));
    const count = selectCartProductQuantity(store.getState(), item);
    announce(count === 0 ? 'cartFeedback.removedStatus' : 'cartFeedback.quantityStatus', count);
  };

  return <div className={`${styles.action} ${styles[variant]} ${containerClassName}`}>
    {quantity === 0 ? (
      <Button ref={addRef} variant="primary" size={size} onClick={increase} className={className}>
        {t('product.addToCart')}
      </Button>
    ) : (
      <div className={styles.inCart} role="group" aria-label={t('cart.quantityFor', { title: item.product.title })}>
        <span className={styles.inCartLabel}>{t('cartFeedback.inCart')}</span>
        <div className={styles.stepper}>
          <button ref={minusRef} type="button" className={styles.stepButton} onClick={decrease}
            aria-label={t('cart.decreaseQuantity', { title: item.product.title })}>
            <QuantityStepIcon direction="decrease" />
          </button>
          <span className={styles.value}>{quantity}</span>
          <button ref={plusRef} type="button" className={styles.stepButton} onClick={increase}
            aria-label={t('cart.increaseQuantity', { title: item.product.title })}>
            <QuantityStepIcon direction="increase" />
          </button>
        </div>
      </div>
    )}
    {variant === 'detail' && quantity > 0 && <Link to="/cart" className={styles.cartLink}>{t('cart.viewCart')}</Link>}
    <span className={styles.srOnly} role="status" aria-atomic="true">{announcement}</span>
  </div>;
};

export default CartProductControl;
