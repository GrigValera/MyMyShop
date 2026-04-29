import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer className={styles.footer}>
      <div className={styles.footerBar}>
        <div className="container">
          <div className={styles.barContent}>
            <p>© {currentYear} MyMy Shop</p>
            <button 
              className={styles.expandBtn}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label="Expand footer"
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>
      </div>
      
      <div className={`${styles.footerExpandable} ${isExpanded ? styles.expanded : ''}`}>
        <div className="container">
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <h4>MyMy Shop</h4>
              <p>{t('footer.tagline')}</p>
            </div>
            <div className={styles.footerSection}>
              <h4>{t('footer.links')}</h4>
              <ul>
                <li><a href="/">{t('nav.home')}</a></li>
                <li><a href="/products">{t('nav.products')}</a></li>
                <li><a href="/cart">{t('nav.cart')}</a></li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4>{t('footer.contact')}</h4>
              <ul>
                <li>Email: support@mymyshop.com</li>
                <li>{t('footer.phone')}: +1 (555) 123-4567</li>
              </ul>
            </div>
            <div className={styles.footerSection}>
              <h4>{t('footer.follow')}</h4>
              <div className={styles.socialLinks}>
                <a href="#" className={styles.socialLink}>Facebook</a>
                <a href="#" className={styles.socialLink}>Instagram</a>
                <a href="#" className={styles.socialLink}>Twitter</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;