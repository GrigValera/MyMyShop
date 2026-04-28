import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../features/auth/store/authSlice';
import { ThemeToggle } from '../../../features/theme/components/ThemeToggle';
import { LanguageSwitcher } from '../../../features/language/LanguageSwitcher';
import { Button } from '../../ui';
import styles from './Header.module.css';

export const Header = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsMenuOpen(false);
  };

  const navLinks = [
  { path: '/', label: t('nav.home') },
  { path: '/products', label: t('nav.products') },
  { path: '/cart', label: t('nav.cart') },
  { path: '/about', label: t('nav.about') },
  { path: '/delivery', label: t('nav.delivery') },
  { path: '/contact', label: t('nav.contact') },
  ...(isAuthenticated && role === 'admin' ? [{ path: '/admin', label: 'Admin Panel' }] : []),
];

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContainer}`}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoText}>MyMy</span>
          <span className={styles.logoAccent}>Shop</span>
        </Link>

        <nav className={styles.desktopNav}>
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <div className={styles.togglesGroup}>
            <ThemeToggle />
            <div className={styles.divider}></div>
            <LanguageSwitcher />
          </div>

          <div className={styles.authGroup}>
            {isAuthenticated ? (
              <>
                <span className={styles.userBadge}>
                  {role === 'admin' ? 'Admin' : 'User'}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                {t('nav.login')}
              </Button>
            )}
          </div>

          <Link to="/cart" className={styles.cartLink}>
            <span className={styles.cartText}>Cart</span>
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </Link>

          <button 
            className={`${styles.menuBtn} ${isMenuOpen ? styles.active : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
        <nav className={styles.mobileNav}>
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={styles.mobileNavLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.mobileToggles}>
          <div className={styles.mobileToggleItem}>
            <span>Theme</span>
            <ThemeToggle />
          </div>
          <div className={styles.mobileToggleItem}>
            <span>Language</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};