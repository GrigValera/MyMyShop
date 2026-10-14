import { useTranslation } from 'react-i18next';
import styles from './AccountPage.module.css';

export default function AccountPlaceholder({ section }) {
  const { t } = useTranslation();
  return <div className={styles.placeholderPage}>
    <h1>{t(`account.${section}`)}</h1>
    <div className={styles.placeholderBody}>
      <p>{t(`account.${section}Description`)}</p>
      <p className={styles.muted}>{t('account.comingSoon')}</p>
    </div>
  </div>;
}
