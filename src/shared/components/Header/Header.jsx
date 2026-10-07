import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../features/auth/store/authSlice";
import ThemeToggle from "../../../features/theme/components/ThemeToggle";
import LanguageSwitcher from "../../../features/language/LanguageSwitcher";
import ProfileDrawer from "../ProfileDrawer/ProfileDrawer";
import CartDrawer from "../CartDrawer/CartDrawer";
import { UserIcon } from '../../../shared/icons/UserIcon';
import { CartIcon } from '../../../shared/icons/CartIcon';
import styles from "./Header.module.css";

const Header = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDemoSession } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const closeCartDrawer = useCallback(() => setIsCartDrawerOpen(false), []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
      if (window.innerWidth <= 768) setIsCartDrawerOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsMenuOpen(false);
      setIsCartDrawerOpen(false);
      setIsProfileDrawerOpen(false);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    setIsMenuOpen(false);
    setIsProfileDrawerOpen(false);
  };

  const navLinks = [
    { path: "/", label: t("nav.home") },
    { path: "/products", label: t("nav.products") },
    { path: "/about", label: t("nav.about") },
    { path: "/delivery", label: t("nav.delivery") },
    { path: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className={`${styles.header} ${isCartDrawerOpen && location.pathname !== '/cart' ? styles.cartDrawerOpen : ''}`}>
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

          {/* Профиль - открывает дровер */}
          {isDemoSession ? (
            <button
              className={`${styles.iconBtn} ${styles.desktopAction}`}
              onClick={() => setIsProfileDrawerOpen(true)}
              aria-label={t('nav.profile')}
            >
              <UserIcon className={styles.icon} />
            </button>
          ) : (
            <button
              className={`${styles.loginBtn} ${styles.desktopAction}`}
              onClick={() => navigate("/login")}
            >
              {t("nav.login")}
            </button>
          )}

          {/* Корзина - открывает дровер */}
          {location.pathname === '/cart' ? (
            <span className={`${styles.iconBtn} ${styles.desktopAction}`} aria-label={t('nav.cart')} aria-current="page">
              <CartIcon className={styles.icon} />
              {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
            </span>
          ) : (
            <button
              className={`${styles.iconBtn} ${styles.desktopAction}`}
              onClick={() => setIsCartDrawerOpen(true)}
              aria-label={t('nav.cart')}
            >
              <CartIcon className={styles.icon} />
              {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
            </button>
          )}

          <button
            className={`${styles.menuBtn} ${isMenuOpen ? styles.active : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={t('mobileNav.menu')}
            aria-expanded={isMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ""}`}>
        <nav className={styles.mobileNav}>
          {navLinks.filter((link) => link.path !== '/' && link.path !== '/products').map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={styles.mobileNavLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => {
              if (isDemoSession) {
                handleLogout();
              } else {
                navigate("/login");
              }
              setIsMenuOpen(false);
            }}
            className={styles.mobileLogoutBtn}
          >
            {isDemoSession ? t("nav.logout") : t("nav.login")}
          </button>
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

      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
      />
      <CartDrawer
        isOpen={isCartDrawerOpen && location.pathname !== '/cart'}
        onClose={closeCartDrawer}
      />
    </header>
  );
};

export default Header;
