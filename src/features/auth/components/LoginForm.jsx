import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '../../../shared/ui';
import { login } from '../store/authSlice';
import styles from './LoginForm.module.css';

const LoginForm = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (email === 'admin@example.com' && password === 'admin123') {
      dispatch(login({ email, role: 'admin' }));
      navigate('/');
    } else if (email === 'user@example.com' && password === 'user123') {
      dispatch(login({ email, role: 'user' }));
      navigate('/');
    } else {
      setError(t('auth.error'));
    }
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
        />
        <Input
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" variant="primary" size="lg" className={styles.submitBtn}>
          {t('auth.submit')}
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