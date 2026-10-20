import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import LoginForm from '../../features/auth/components/LoginForm';
import { selectHasSession, selectSessionStatus } from '../../features/auth/store/authSlice';
import styles from '../LoginPage/LoginPage.module.css';

export default function RegisterPage() {
  const hasSession = useSelector(selectHasSession);
  const status = useSelector(selectSessionStatus);
  const { t } = useTranslation();
  if (status === 'loading') return <p role="status">{t('account.loading')}</p>;
  if (hasSession) return <Navigate to="/account" replace />;
  return <div className={styles.loginPage}><LoginForm kind="register" /></div>;
}
