import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../../shared/ui';
import { startSession, selectCanDemoSignIn, selectSessionStatus } from '../store/authSlice';
import { useSessionRetry } from '../model/useSessionRetry';
import RetryButton from './RetryButton';
import AuthField from './AuthField';
import styles from './LoginForm.module.css';

function safeNext(value) {
  if (!value || !value.startsWith('/account') || (value.length > 8 && !['/', '?', '#'].includes(value[8]))) return '/account';
  if (value.startsWith('//') || value.includes('\\') || [...value].some(char => char.charCodeAt(0) < 32)) return '/account';
  return value;
}

export default function LoginForm({ kind = 'login' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const dispatch = useDispatch();
  const canDemoSignIn = useSelector(selectCanDemoSignIn);
  const sessionStatus = useSelector(selectSessionStatus);
  const retry = useSessionRetry();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle');

  async function submit(event) {
    event.preventDefault();
    if (state === 'submitting') return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const email = values.email.trim();
    const nextErrors = {};
    if (!email) nextErrors.email = 'required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) nextErrors.email = 'invalidEmail';
    if (!values.password) nextErrors.password = 'required';
    else if (values.password.length > 128) nextErrors.password = 'longPassword';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      (nextErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setState('submitting');
    const result = await dispatch(startSession({ email, password: values.password }));
    if (result.status === 'authenticated') navigate(safeNext(params.get('next')), { replace: true });
    else setState(result.status === 'invalid_credentials' ? 'invalid_credentials' : 'error');
  }

  return <Card staticSurface className={styles.loginCard}>
    <h1 className={styles.title}>{t(`auth.${kind}.title`)}</h1>
    {kind === 'login'
      ? <p className={styles.intro}>{t('auth.realDemoIntro')}</p>
      : <p className={styles.capabilityNotice} role="status">{t('auth.identityUnavailable')}</p>}
    {kind === 'login' && canDemoSignIn && <>
      <section className={styles.demoCredentials} aria-labelledby="demo-access-title">
        <h2 id="demo-access-title">{t('auth.demoAccess')}</h2>
        <dl>
          <div><dt>{t('auth.email')}</dt><dd>demo@mymyshop.dev</dd></div>
          <div><dt>{t('auth.password')}</dt><dd>DemoShop-2026!</dd></div>
        </dl>
      </section>
      <form className={styles.form} onSubmit={submit} noValidate onChange={() => { setErrors({}); if (state !== 'idle') setState('idle'); }}>
        <AuthField name="email" label={t('auth.email')} type="email" autoComplete="username" error={errors.email} inputRef={emailRef} />
        <AuthField name="password" label={t('auth.password')} type="password" autoComplete="current-password" error={errors.password} inputRef={passwordRef} />
        {state === 'invalid_credentials' && <p role="alert" className={styles.formError}>{t('auth.invalidCredentials')}</p>}
        {state === 'error' && <p role="alert" className={styles.formError}>{t('auth.loginUnavailable')}</p>}
        <Button type="submit" disabled={state === 'submitting'} className={styles.submitBtn}>{t(state === 'submitting' ? 'auth.submitting' : 'auth.login.submit')}</Button>
      </form>
    </>}
    {kind === 'login' && !canDemoSignIn && sessionStatus !== 'unavailable' && <p className={styles.capabilityNotice} role="status">{t('auth.loginDisabled')}</p>}
    {kind === 'login' && sessionStatus === 'unavailable' && <div role="alert" className={`${styles.formError} ${styles.retryError}`}><p>{t('auth.sessionUnavailable')}</p><RetryButton onClick={retry.run} pending={retry.pending} /></div>}
    {kind !== 'login' && <Link className={styles.backLink} to="/login"><span aria-hidden="true">←</span>{t('auth.backToLogin')}</Link>}
    {kind === 'login' && <p className={styles.demoInfo}>{t('auth.realDemoNotice')}</p>}
  </Card>;
}
