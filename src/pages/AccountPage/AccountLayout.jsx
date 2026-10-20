import { useLayoutEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogout } from '../../features/auth/model/useLogout';
import LogoutFeedback from '../../features/auth/components/LogoutFeedback';
import { Button } from '../../shared/ui';
import styles from './AccountPage.module.css';

const destinations = [
  { path: '/account', label: 'title', end: true },
  { path: '/account/profile', label: 'personalData' },
  { path: '/account/orders', label: 'orders' },
  { path: '/account/addresses', label: 'addresses' },
  { path: '/account/reviews', label: 'reviews' },
  { path: '/account/settings', label: 'settings' },
];

export default function AccountLayout() {
  const { t } = useTranslation();
  const signOut = useLogout();
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return <div className={styles.accountShell}>
    <aside className={styles.accountSidebar}>
      <nav className={styles.accountNavigation} aria-label={t('account.title')}>
        {destinations.map(({ path, label, end }) => <NavLink key={path} end={end} to={path}
          className={({ isActive }) => `${styles.accountLink} ${isActive ? styles.accountLinkActive : ''}`}>
          {t(`account.${label}`)}
        </NavLink>)}
      </nav>
      <Button className={styles.logoutAction} variant="secondary" onClick={signOut.run} disabled={signOut.pending}>{t(signOut.pending ? 'auth.submitting' : 'account.signOut')}</Button>
      {signOut.error && <LogoutFeedback />}
    </aside>
    <div className={styles.accountMain}>
      {pathname !== '/account' && <Link to="/account" className={styles.backToAccount}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="m14.5 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {t('account.title')}
      </Link>}
      <Outlet />
    </div>
    {pathname === '/account' && <div className={styles.mobileLogout}><Button variant="secondary" onClick={signOut.run} disabled={signOut.pending}>{t(signOut.pending ? 'auth.submitting' : 'account.signOut')}</Button>{signOut.error && <LogoutFeedback />}</div>}
  </div>;
}
