import LoginForm from '../../features/auth/components/LoginForm';
import styles from '../LoginPage/LoginPage.module.css';

export default function ForgotPasswordPage() {
  return <div className={styles.loginPage}><LoginForm kind="recovery" /></div>;
}
