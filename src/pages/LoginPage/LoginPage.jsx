import { Navigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import LoginForm from '../../features/auth/components/LoginForm';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { t } = useTranslation();
  const { isDemoSession } = useSelector((state) => state.auth);
  if (isDemoSession) return <Navigate to="/profile" replace />;
  return (
    <div className={styles.loginPage}>
      <LoginForm />
      <div className={styles.registerLink}><Link to="/">{t('nav.home')}</Link></div>
    </div>
  );
};
export default LoginPage;
