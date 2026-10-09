import { useLayoutEffect } from 'react';
import { NavLink, useLocation, useNavigationType } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { CartIcon } from '../../icons/CartIcon';
import { UserIcon } from '../../icons/UserIcon';
import styles from './MobileNavigation.module.css';

const HomeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/></svg>;
const CatalogIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;

const MobileNavigation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { pathname } = location;
  const navigationType = useNavigationType();
  const count = useSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0));

  useLayoutEffect(() => {
    if (navigationType === 'PUSH' && location.state?.mobilePrimaryNavigation === true) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.key, location.state, navigationType]);
  const items = [
    { to: '/', label: t('mobileNav.home'), icon: <HomeIcon /> },
    { to: '/products', label: t('mobileNav.catalog'), icon: <CatalogIcon /> },
    { to: '/cart', label: t('nav.cart'), icon: <CartIcon />, badge: count },
    { to: '/account', label: t('nav.profile'), icon: <UserIcon /> },
  ];

  return <nav className={styles.navigation} aria-label={t('mobileNav.label')}>
    {items.map(({ to, label, icon, badge }) => {
      const current = pathname === to;
      const active = current || (to === '/products' && pathname.startsWith('/product/'));
      return <NavLink key={to} to={to} state={{ mobilePrimaryNavigation: true }} className={`${styles.item} ${active ? styles.active : ''}`} aria-current={current ? 'page' : undefined} aria-describedby={to === '/cart' && badge > 0 ? 'mobile-cart-count' : undefined}>
        <span className={styles.iconWrap}>{icon}{badge > 0 && <span className={styles.badge} aria-hidden="true">{badge > 99 ? '99+' : badge}</span>}</span>
        <span className={styles.label}>{label}</span>
      </NavLink>;
    })}
    {count > 0 && <span id="mobile-cart-count" className={styles.srOnly}>{t('mobileNav.cartCount', { count })}</span>}
  </nav>;
};

export default MobileNavigation;
