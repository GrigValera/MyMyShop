import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from '../../features/auth/components/LoginForm';
import { selectHasSession } from '../../features/auth/store/authSlice';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const hasSession = useSelector(selectHasSession);
  if (hasSession) return <Navigate to="/profile" replace />;
  return (
    <div className={styles.loginPage}>
      <LoginForm />
    </div>
  );
};
export default LoginPage;
