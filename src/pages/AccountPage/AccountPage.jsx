import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { accountService } from '../../features/account/api/accountService';
import { useAccountProfile } from '../../features/account/model/useAccountProfile';
import AccountAvatar from '../../features/account/components/AccountAvatar';
import { Card } from '../../shared/ui';
import RetryButton from '../../features/auth/components/RetryButton';
import styles from './AccountPage.module.css';

function DestinationRow({ to, label, detail }) {
  return <Link to={to} className={styles.destinationRow}>
    <span className={styles.destinationCopy}><strong>{label}</strong>{detail && <small>{detail}</small>}</span>
    <span className={styles.rowChevron} aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" focusable="false"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
  </Link>;
}

export default function AccountPage() {
  const { t } = useTranslation();
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0));
  const profile = useAccountProfile();
  const [overview, setOverview] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const retryInFlight = useRef(false);
  const retry = useCallback(() => {
    if (retryInFlight.current) return;
    retryInFlight.current = true;
    setRetrying(true);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    accountService.getOverview().then((result) => {
      if (active) { setOverview(result); retryInFlight.current = false; setRetrying(false); }
    });
    return () => { active = false; };
  }, [attempt]);

  return <div aria-labelledby="account-title">
    <header className={styles.heading}><h1 id="account-title">{t('account.title')}</h1></header>

    {overview.status === 'loading' && <p role="status">{t('account.loading')}</p>}
    {overview.status === 'error' && <Card staticSurface className={styles.stateCard}>
      <p role="alert">{t('account.unavailable')}</p>
      <RetryButton onClick={retry} pending={retrying} />
    </Card>}
    {overview.status === 'success' && <div className={styles.overviewContent}>
      <section className={styles.profileSummary} aria-labelledby="profile-summary-title">
        <div className={styles.identityRow}>
          <AccountAvatar profile={profile} />
          <div className={styles.identityText}>
            <div className={styles.identityHeading}><h2 id="profile-summary-title">{profile.displayName}</h2><span className={styles.badge}>{t('account.demoBadge')}</span></div>
            <p>{t('auth.demoRefresh')}</p>
          </div>
        </div>
        <Link to="/account/profile" className={styles.editProfileLink}>{t('account.editProfile')}</Link>
      </section>

      <section className={styles.destinationGroup} aria-labelledby="purchases-title">
        <h2 id="purchases-title">{t('account.purchases')}</h2>
        <nav aria-label={t('account.purchases')} className={styles.destinationList}>
          <DestinationRow to="/account/orders" label={t('account.orders')} />
          <DestinationRow to="/cart" label={t('account.cartTitle')} detail={cartCount ? t('account.cartItems', { count: cartCount }) : t('account.emptyCart')} />
          <DestinationRow to="/account/addresses" label={t('account.addresses')} />
          <DestinationRow to="/account/reviews" label={t('account.reviews')} />
        </nav>
      </section>

      <section className={styles.destinationGroup} aria-labelledby="account-destinations-title">
        <h2 id="account-destinations-title">{t('account.accountGroup')}</h2>
        <nav aria-label={t('account.accountGroup')} className={styles.destinationList}>
          <DestinationRow to="/account/settings" label={t('account.settings')} />
        </nav>
      </section>
      <p className={styles.demoNote}>{t('account.demoNotice')}</p>
    </div>}
  </div>;
}
