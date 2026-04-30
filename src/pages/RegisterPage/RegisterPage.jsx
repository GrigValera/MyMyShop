import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '../../shared/ui';
import { registerUser } from '../../features/auth/api/authService';
import { setUser } from '../../features/auth/store/authSlice';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorState('');
    
    if (password !== confirmPassword) {
      setErrorState(t('auth.passwordMismatch'));
      return;
    }
    
    setLoading(true);
    
    const { user, error } = await registerUser(email, password, name);
    
    setLoading(false);
    
    if (error) {
      setErrorState(error);
    } else if (user) {
      dispatch(setUser(user));
      navigate('/');
    }
  };

  return (
    <div className={styles.registerPage}>
      <Card className={styles.registerCard}>
        <h2 className={styles.title}>{t('auth.register')}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label={t('auth.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="off"
          />
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" variant="primary" size="lg" className={styles.submitBtn} disabled={loading}>
            {loading ? t('common.loading') : t('auth.registerBtn')}
          </Button>
        </form>
        <p className={styles.loginLink}>
          {t('auth.haveAccount')} <Link to="/login">{t('auth.login')}</Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;