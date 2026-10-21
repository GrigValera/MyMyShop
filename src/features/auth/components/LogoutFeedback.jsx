import { useTranslation } from 'react-i18next';
import styles from './LogoutFeedback.module.css';

export default function LogoutFeedback() {
  const { t } = useTranslation();
  return <p role="alert" className={styles.feedback}>{t('auth.logoutFailed')}</p>;
}
