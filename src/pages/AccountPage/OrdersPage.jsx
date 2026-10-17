import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { orderService } from '../../features/orders/api/orderService';
import { countOrderItems, formatOrderDate, formatOrderMoney } from '../../features/orders/model/orderPresentation';
import ProductImage from '../../features/products/components/ProductImage';
import styles from './OrdersPage.module.css';

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const [result, setResult] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => { setResult({ status: 'loading' }); setAttempt((value) => value + 1); }, []);

  useEffect(() => {
    let active = true;
    orderService.listOrders().then((value) => { if (active) setResult(value); });
    return () => { active = false; };
  }, [attempt]);

  return <div className={styles.page}>
    <header className={styles.pageHeader}>
      <h1>{t('account.orders')}</h1>
      <p className={styles.demoLabel}>{t('orders.demoLabel')}</p>
    </header>
    {result.status === 'loading' && <p role="status">{t('orders.loading')}</p>}
    {result.status === 'error' && <div className={styles.state} role="alert">
      <p>{t('orders.unavailable')}</p>
      <button type="button" onClick={retry}>{t('common.retry')}</button>
    </div>}
    {result.status === 'success' && result.data.length === 0 && <div className={styles.state}>
      <h2>{t('orders.empty')}</h2>
      <Link to="/products">{t('orders.browseCatalog')}</Link>
    </div>}
    {result.status === 'success' && result.data.length > 0 && <ol className={styles.orderList}>
      {result.data.map((order) => <li key={order.id}>
        <article className={styles.order} aria-labelledby={`order-${order.id}`}>
          <div className={styles.orderHeading}>
            <div>
              <p className={`${styles.status} ${styles[order.status]}`}>{t(`orders.status.${order.status}`)}</p>
              <h2 id={`order-${order.id}`}>{t('orders.orderNumber', { number: order.displayNumber })}</h2>
              <time dateTime={order.placedAt}>{formatOrderDate(order.placedAt, i18n.language)}</time>
            </div>
            <strong className={styles.orderTotal}>{formatOrderMoney(order.totals.totalMinor, order.currency, i18n.language)}</strong>
          </div>
          <div className={styles.orderBody}>
            <div className={styles.thumbnails} aria-hidden="true">
              {order.items.slice(0, 2).map((item) => <ProductImage key={item.productId} src={item.imageSnapshot} alt="" width={72} height={72} />)}
            </div>
            <div className={styles.summary}>
              <p>{order.items.map((item) => item.titleSnapshot).join(' · ')}</p>
              <span>{t('orders.itemCount', { count: countOrderItems(order) })}</span>
            </div>
          </div>
          <Link className={styles.detailsLink} to={`/account/orders/${order.id}`}>
            {t('orders.viewDetails', { number: order.displayNumber })}
          </Link>
        </article>
      </li>)}
    </ol>}
  </div>;
}
