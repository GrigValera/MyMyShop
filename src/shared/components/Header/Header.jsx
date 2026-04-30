import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

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
    ...(isAuthenticated && role === "admin"
      ? [{ path: "/admin", label: "Admin Panel" }]
      : []),
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

          {/* Профиль - открывает дровер */}
          {isAuthenticated ? (
            <button
              className={styles.iconBtn}
              onClick={() => setIsProfileDrawerOpen(true)}
              aria-label="Profile"
            >
              <UserIcon className={styles.icon} />
            </button>
          ) : (
            <button
              className={styles.loginBtn}
              onClick={() => navigate("/login")}
            >
              {t("nav.login")}
            </button>
          )}

          {/* Корзина - открывает дровер */}
          <button
            className={styles.iconBtn}
            onClick={() => setIsCartDrawerOpen(true)}
            aria-label="Cart"
          >
            <CartIcon className={styles.icon} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </button>

          <button
            className={`${styles.menuBtn} ${isMenuOpen ? styles.active : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ""}`}>
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
          {isAuthenticated && (
            <Link
              to="/profile"
              className={styles.mobileNavLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("nav.profile")}
            </Link>
          )}
          <button
            onClick={() => {
              if (isAuthenticated) {
                handleLogout();
              } else {
                navigate("/login");
              }
              setIsMenuOpen(false);
            }}
            className={styles.mobileLogoutBtn}
          >
            {isAuthenticated ? t("nav.logout") : t("nav.login")}
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
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
      />
    </header>
  );
};

export default Header;