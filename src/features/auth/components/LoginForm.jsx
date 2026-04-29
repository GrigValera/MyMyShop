import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '../../../shared/ui';
import { loginUser } from '../api/authService';
import { setUser } from '../store/authSlice';
import styles from './LoginForm.module.css';

const LoginForm = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoadingState] = useState(false);
  const [error, setErrorState] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorState('');
    setLoadingState(true);
    
    const { user, error } = await loginUser(email, password);
    
    if (error) {
      setErrorState(t('auth.error'));
    } else if (user) {
      dispatch(setUser(user));
      navigate('/');
    }
    setLoadingState(false);
  };

  return (
    <Card className={styles.loginCard}>
      <h2 className={styles.title}>{t('auth.login')}</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
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
          autoComplete="current-password"
        />
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" variant="primary" size="lg" className={styles.submitBtn} disabled={loading}>
          {loading ? t('common.loading') : t('auth.submit')}
        </Button>
      </form>
      <div className={styles.demoInfo}>
        <p>Demo: user@example.com / user123</p>
        <p>Admin: admin@example.com / admin123</p>
      </div>
    </Card>
  );
};

export default LoginForm;