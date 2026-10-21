import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { selectSessionStatus } from '../store/authSlice';
import { useSessionRetry } from '../model/useSessionRetry';
import { Card } from '../../../shared/ui';
import RetryButton from './RetryButton';
import styles from './RequireSession.module.css';

export default function RequireSession() {
  const status = useSelector(selectSessionStatus);
  const retry = useSessionRetry();
  const location = useLocation();
  const { t } = useTranslation();
  if (status === 'authenticated') return <Outlet />;
  if (status === 'loading') return <p role="status">{t('account.loading')}</p>;
  if (status === 'unavailable') return <Card staticSurface className={styles.unavailable}>
    <section role="alert">
      <h1>{t('auth.unavailableTitle')}</h1>
      <p>{t('auth.unavailableDescription')}</p>
      <RetryButton onClick={retry.run} pending={retry.pending} />
    </section>
  </Card>;
  return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}
