import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <nav className={`${styles.footerSection} ${styles.shopping}`} aria-label={t('footer.shopping')}>
            <h2>{t('footer.shopping')}</h2>
            <ul>
              <li><Link to="/products">{t('nav.products')}</Link></li>
              <li><Link to="/cart">{t('nav.cart')}</Link></li>
            </ul>
          </nav>
          <nav className={styles.footerSection} aria-label={t('footer.information')}>
            <h2>{t('footer.information')}</h2>
            <ul>
              <li><Link to="/about">{t('nav.about')}</Link></li>
              <li><Link to="/delivery">{t('nav.delivery')}</Link></li>
            </ul>
          </nav>
        </div>
      </div>
      <div className={styles.footerBar}>
        <div className="container">
          <p>© {currentYear} MyMy Shop</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
