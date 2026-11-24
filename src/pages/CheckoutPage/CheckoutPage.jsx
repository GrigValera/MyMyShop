import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clearCart } from '../../features/cart/store/cartSlice';
import { selectHasSession } from '../../features/auth/store/authSlice';
import { isPortfolioDemo, confirmDemoOrder } from '../../shared/portfolioDemo.js';
import { checkoutService } from '../../features/checkout/api/checkoutService';
import styles from './CheckoutPage.module.css';

export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const en = i18n.language === 'en';
  const hasSession = useSelector(selectHasSession);
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(false);
  function confirm() {
    try { setOrder(confirmDemoOrder(cartItems)); dispatch(clearCart()); }
    catch { setError(true); }
  }
  const headingRef = useRef(null);
  const cartItems = useSelector((state) => state.cart.items);
  const preview = checkoutService.preview(cartItems);

  useEffect(() => { headingRef.current?.focus(); }, [order]);

  if (order) return <div className={styles.page}>
    <h1 ref={headingRef} tabIndex={-1}>{en ? 'Test order confirmed' : 'Тестовый заказ оформлен'}</h1>
    <p>{order.displayNumber}</p>
    <Link className={styles.returnLink} to={'/account/orders/' + order.id}>{en ? 'Open order' : 'Открыть заказ'}</Link>
  </div>;

  if (preview.items.length === 0) return <Navigate to="/cart" replace />;

  return <div className={styles.page}>
    <h1 ref={headingRef} tabIndex={-1}>{t('checkout.title')}</h1>
    <section className={styles.notice} aria-labelledby="checkout-status-title">
      {isPortfolioDemo ? <>
        <h2 id="checkout-status-title">{en ? 'Demo checkout' : 'Демонстрационное оформление'}</h2>
        <p>{en ? 'The order stays in this browser. No payment is collected.' : 'Заказ сохраняется в этом браузере. Деньги не списываются.'}</p>
        {hasSession ? <button type="button" className={styles.confirm} onClick={confirm}>{en ? 'Place test order' : 'Оформить тестовый заказ'}</button>
          : <Link to="/login?next=%2Fcheckout" className={styles.returnLink}>{en ? 'Sign in to the demo account' : 'Войти в демо-аккаунт'}</Link>}
        {error && <p role="alert">{en ? 'Could not save the order.' : 'Не удалось сохранить заказ.'}</p>}
      </> : <>
        <h2 id="checkout-status-title">{t('checkout.unavailableTitle')}</h2>
        <p>{t('checkout.unavailableBody')}</p>
        <Link className={styles.returnLink} to="/cart">{t('checkout.backToCart')}</Link>
      </>}
    </section>
    <section className={styles.summary} aria-labelledby="checkout-summary-title">
      <h2 id="checkout-summary-title">{t('checkout.summaryTitle')}</h2>
      <ul>
        {preview.items.map((item) => <li key={`${item.source || 'demo'}-${item.id}-${item.hasDiscount}-${item.price}`}>
          <div className={styles.itemInfo}>
            <span>{item.title}</span>
            <span className={styles.itemQuantity}>{t('checkout.quantity', { count: item.quantity })}</span>
          </div>
          <strong>${(item.price * item.quantity).toFixed(2)}</strong>
        </li>)}
      </ul>
      <p className={styles.itemCount}><span>{t('checkout.itemCount')}</span><strong>{preview.itemCount}</strong></p>
      <p className={styles.subtotal}><span>{t('checkout.subtotal')}</span><strong>${preview.subtotal.toFixed(2)}</strong></p>
      <p className={styles.priceNote}>{t('checkout.priceNote')}</p>
    </section>
    <div className={styles.actions}>
      <Link to="/products" className={styles.catalogLink}>{t('common.continue')}</Link>
    </div>
  </div>;
}
