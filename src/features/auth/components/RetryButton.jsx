import { useTranslation } from 'react-i18next';
import { Button } from '../../../shared/ui';
import styles from './RetryButton.module.css';

export default function RetryButton({ onClick, pending }) {
  const { t } = useTranslation();

  return <Button className={styles.retryButton} onClick={onClick} disabled={pending} aria-busy={pending}>
    {t('common.retry')}
    <span className={styles.progressSlot} aria-hidden="true"><span className={styles.spinner} /></span>
  </Button>;
}
