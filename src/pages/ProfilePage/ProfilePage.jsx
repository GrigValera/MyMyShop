import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../shared/ui';
import { logout } from '../../features/auth/store/authSlice';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isDemoSession, user, cleanupFailed } = useSelector((state) => state.auth);
  return (
    <div className={styles.profilePage}>
      <h1>{t('auth.demoTitle')}</h1>
      <Card className={styles.profileCard}>
        <p>{t('auth.demoNotice')}</p>
        <p>{t('auth.demoRefresh')}</p>
        {cleanupFailed && <p role="alert">{t('auth.cleanupFailed')}</p>}
        {isDemoSession ? <>
          <h2>{user.name}</h2>
          <Button onClick={() => dispatch(logout())}>{t('nav.logout')}</Button>
        </> : <Link to="/login">{t('auth.demoLogin')}</Link>}
      </Card>
    </div>
  );
};
export default ProfilePage;
