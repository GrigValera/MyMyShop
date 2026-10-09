import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from '../../features/auth/components/LoginForm';
import { selectHasSession } from '../../features/auth/store/authSlice';
import styles from '../LoginPage/LoginPage.module.css';

export default function RegisterPage() {
  const hasSession = useSelector(selectHasSession);
  if (hasSession) return <Navigate to="/account" replace />;
  return <div className={styles.loginPage}><LoginForm kind="register" /></div>;
}
