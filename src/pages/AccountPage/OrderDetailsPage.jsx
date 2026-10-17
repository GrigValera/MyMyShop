import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderService } from '../../features/orders/api/orderService';
import { formatOrderDate, formatOrderMoney, orderSnapshotLabel } from '../../features/orders/model/orderPresentation';
import ProductImage from '../../features/products/components/ProductImage';
import styles from './OrdersPage.module.css';

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const { t, i18n } = useTranslation();
  const [result, setResult] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => { setResult({ status: 'loading' }); setAttempt((value) => value + 1); }, []);

  useEffect(() => {
    let active = true;
    orderService.getOrder(orderId).then((value) => { if (active) setResult(value); });
    return () => { active = false; };
  }, [orderId, attempt]);

  if (result.status === 'loading') return <p role="status">{t('orders.loading')}</p>;
  if (result.status === 'error') return <div className={styles.state} role="alert">
    <h1>{t('orders.unavailableTitle')}</h1><p>{t('orders.unavailable')}</p>
    <button type="button" onClick={retry}>{t('common.retry')}</button>
    <Link to="/account/orders">{t('orders.backToOrders')}</Link>
  </div>;
  if (result.status === 'not-found') return <div className={styles.state}>
    <h1>{t('orders.notFound')}</h1><p>{t('orders.notFoundBody')}</p>
    <Link to="/account/orders">{t('orders.backToOrders')}</Link>
  </div>;

  const order = result.data;
  const money = (minor) => formatOrderMoney(minor, order.currency, i18n.language);
  return <div className={styles.page}>
    <Link className={styles.backToOrders} to="/account/orders">← {t('orders.backToOrders')}</Link>
    <header className={styles.pageHeader}>
      <p className={styles.demoLabel}>{t('orders.demoLabel')}</p>
      <h1>{t('orders.orderNumber', { number: order.displayNumber })}</h1>
      <div className={styles.detailMeta}>
        <time dateTime={order.placedAt}>{formatOrderDate(order.placedAt, i18n.language)}</time>
        <span className={`${styles.status} ${styles[order.status]}`}>{t(`orders.status.${order.status}`)}</span>
      </div>
    </header>
    <section className={styles.section} aria-labelledby="order-items-title">
      <h2 id="order-items-title">{t('orders.itemsTitle')}</h2>
      <ul className={styles.itemList}>
        {order.items.map((item, index) => <li className={styles.item} key={`${item.productId ?? 'snapshot'}-${index}`}>
          <ProductImage src={item.imageSnapshot} alt={item.titleSnapshot} width={88} height={88} />
          <div className={styles.itemCopy}>
            <h3>{item.titleSnapshot}</h3>
            <p>{t('orders.unitPrice')}: {money(item.unitPriceMinor)} · {t('orders.quantity')}: {item.quantity}</p>
          </div>
          <strong className={styles.lineTotal}>{money(item.lineTotalMinor)}</strong>
        </li>)}
      </ul>
    </section>
    <section className={styles.section} aria-labelledby="order-total-title">
      <h2 id="order-total-title">{t('orders.summaryTitle')}</h2>
      <dl className={styles.totals}>
        <div><dt>{t('orders.subtotal')}</dt><dd>{money(order.totals.subtotalMinor)}</dd></div>
        <div className={styles.grandTotal}><dt>{t('orders.total')}</dt><dd>{money(order.totals.totalMinor)}</dd></div>
      </dl>
    </section>
    {(order.deliverySnapshot || order.paymentSnapshot) && <div className={styles.snapshotGrid}>
      {order.deliverySnapshot && <section className={styles.section} aria-labelledby="order-delivery-title">
        <h2 id="order-delivery-title">{t('orders.deliveryTitle')}</h2>
        <p>{orderSnapshotLabel(order.deliverySnapshot.recipientLabel, i18n.language)}</p>
        <address>{order.deliverySnapshot.addressLines.map((line) => <span key={line}>{line}<br /></span>)}</address>
        <p>{t('orders.deliveryMethod')}: {orderSnapshotLabel(order.deliverySnapshot.methodLabel, i18n.language)}</p>
      </section>}
      {order.paymentSnapshot && <section className={styles.section} aria-labelledby="order-payment-title">
        <h2 id="order-payment-title">{t('orders.paymentTitle')}</h2>
        <p>{orderSnapshotLabel(order.paymentSnapshot.methodLabel, i18n.language)}</p>
      </section>}
    </div>}
  </div>;
}
