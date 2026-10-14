import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { checkoutService } from '../../features/checkout/api/checkoutService';
import styles from './CheckoutPage.module.css';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const headingRef = useRef(null);
  const cartItems = useSelector((state) => state.cart.items);
  const preview = checkoutService.preview(cartItems);

  useEffect(() => { headingRef.current?.focus(); }, []);

  if (preview.items.length === 0) return <Navigate to="/cart" replace />;

  return <div className={styles.page}>
    <h1 ref={headingRef} tabIndex={-1}>{t('checkout.title')}</h1>
    <section className={styles.notice} aria-labelledby="checkout-status-title">
      <h2 id="checkout-status-title">{t('checkout.unavailableTitle')}</h2>
      <p>{t('checkout.unavailableBody')}</p>
      <Link to="/cart" className={styles.returnLink}>{t('checkout.backToCart')}</Link>
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
