import { useTranslation } from 'react-i18next';
import styles from './RemoveButton.module.css';

const RemoveButton = ({ item, onClick, className = '' }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`${styles.button} ${className}`}
      aria-label={t('cart.removeItem', { title: item.title })}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v6M14 11v6" />
      </svg>
      <span>{t('cart.remove')}</span>
    </button>
  );
};

export default RemoveButton;
