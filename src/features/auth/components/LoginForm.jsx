import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../../shared/ui';
import { startSession, selectSessionCleanupFailed, selectSessionError } from '../store/authSlice';
import styles from './LoginForm.module.css';

const LoginForm = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cleanupFailed = useSelector(selectSessionCleanupFailed);
  const sessionError = useSelector(selectSessionError);
  return (
    <Card className={styles.loginCard}>
      <h2 className={styles.title}>{t('auth.demoTitle')}</h2>
      <p>{t('auth.demoNotice')}</p>
      <p>{t('auth.demoRefresh')}</p>
      {cleanupFailed && <p role="alert">{t('auth.cleanupFailed')}</p>}
      {sessionError && <p role="alert">{t('auth.sessionUnavailable')}</p>}
      <Button onClick={() => dispatch(startSession())} variant="primary" size="lg" className={styles.submitBtn}>
        {t('auth.demoLogin')}
      </Button>
    </Card>
  );
};
export default LoginForm;
