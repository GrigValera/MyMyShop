import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { accountService } from '../../features/account/api/accountService';
import { logout } from '../../features/auth/store/authSlice';
import { Button, Card } from '../../shared/ui';
import styles from './AccountPage.module.css';

export default function AccountPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0));
  const [overview, setOverview] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setOverview({ status: 'loading' });
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    accountService.getOverview().then((result) => {
      if (active) setOverview(result);
    });
    return () => { active = false; };
  }, [attempt]);

  return <section className={styles.account} aria-labelledby="account-title">
    <header className={styles.heading}>
      <p className={styles.eyebrow}>{t('account.overview')}</p>
      <h1 id="account-title">{t('account.title')}</h1>
    </header>

    {overview.status === 'loading' && <p role="status">{t('account.loading')}</p>}
    {overview.status === 'error' && <Card className={styles.stateCard}>
      <p role="alert">{t('account.unavailable')}</p>
      <Button onClick={retry}>{t('common.retry')}</Button>
    </Card>}
    {overview.status === 'success' && <div className={styles.content}>
      <Card className={styles.identityCard}>
        <div className={styles.avatar} aria-label={t('account.avatarFor', { name: overview.data.displayName })} role="img">
          {overview.data.initials}
        </div>
        <div className={styles.identityText}>
          <span className={styles.badge}>{t('account.demoBadge')}</span>
          <h2>{overview.data.displayName}</h2>
          <p>{overview.data.email}</p>
          <p className={styles.fixtureNote}>{t('account.demoEmail')}</p>
        </div>
      </Card>

      <div className={styles.columns}>
        <Card className={styles.cartCard}>
          <h2>{t('account.cartTitle')}</h2>
          <p className={styles.cartCount}>{t('account.cartCount', { count: cartCount })}</p>
          <p>{t(cartCount ? 'account.cartReady' : 'account.cartEmpty')}</p>
          <div className={styles.links}>
            <Link to="/cart" className={styles.primaryLink}>{t('account.viewCart')}</Link>
            <Link to="/products" className={styles.secondaryLink}>{t('account.browseProducts')}</Link>
          </div>
        </Card>
        <Card className={styles.demoCard}>
          <h2>{t('account.demoTitle')}</h2>
          <p>{t('account.demoNotice')}</p>
          <Button variant="secondary" onClick={() => dispatch(logout())}>{t('nav.logout')}</Button>
        </Card>
      </div>
    </div>}
  </section>;
}
