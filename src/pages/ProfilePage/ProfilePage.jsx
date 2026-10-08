import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../shared/ui';
import { logout, selectHasSession, selectSessionUser, selectSessionCleanupFailed, selectSessionError } from '../../features/auth/store/authSlice';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasSession = useSelector(selectHasSession);
  const user = useSelector(selectSessionUser);
  const cleanupFailed = useSelector(selectSessionCleanupFailed);
  const sessionError = useSelector(selectSessionError);
  return (
    <div className={styles.profilePage}>
      <h1>{t('auth.demoTitle')}</h1>
      <Card className={styles.profileCard}>
        <p>{t('auth.demoNotice')}</p>
        <p>{t('auth.demoRefresh')}</p>
        {cleanupFailed && <p role="alert">{t('auth.cleanupFailed')}</p>}
        {sessionError && <p role="alert">{t('auth.sessionUnavailable')}</p>}
        {hasSession ? <>
          <h2>{user.name}</h2>
          <Button onClick={() => dispatch(logout())}>{t('nav.logout')}</Button>
        </> : <div className={styles.authLinks}><Link to="/login">{t('auth.login.title')}</Link><Link to="/register">{t('auth.register.title')}</Link></div>}
      </Card>
    </div>
  );
};
export default ProfilePage;
