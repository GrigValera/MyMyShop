import { Navigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from '../../features/auth/components/LoginForm';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.loginPage}>
      <LoginForm />
      <div className={styles.registerLink}>
        <p>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;