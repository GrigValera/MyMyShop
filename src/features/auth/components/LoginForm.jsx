import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Card } from '../../../shared/ui';
import { sessionService } from '../api/sessionService';
import { signIn, startSession, selectSessionCleanupFailed, selectSessionError } from '../store/authSlice';
import { validateAuthForm } from './authValidation';
import AuthField from './AuthField';
import styles from './LoginForm.module.css';

export default function LoginForm({ kind = 'login' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cleanupFailed = useSelector(selectSessionCleanupFailed);
  const sessionError = useSelector(selectSessionError);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle');
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmationRef = useRef(null);
  const refs = { name: nameRef, email: emailRef, password: passwordRef, confirmation: confirmationRef };
  const submitting = state === 'submitting';

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const nextErrors = validateAuthForm(kind, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      refs[Object.keys(nextErrors)[0]].current?.focus();
      return;
    }
    setState('submitting');
    try {
      const input = { ...values, email: values.email.trim(), ...(values.name ? { name: values.name.trim() } : {}) };
      if (kind === 'login') {
        const result = await dispatch(signIn({ email: input.email, password: input.password }));
        if (result.status === 'demo') navigate('/account');
        else setState('error');
      } else {
        const result = kind === 'register'
          ? await sessionService.signUp(input)
          : await sessionService.requestPasswordReset({ email: input.email });
        setState(result.status === 'demo-only' ? 'success' : 'error');
        form.reset();
      }
    } catch {
      setState('error');
    }
  }

  async function continueDemo() {
    if (submitting) return;
    setState('submitting');
    const result = await dispatch(startSession());
    if (result.status === 'demo') navigate('/account');
    else setState('error');
  }

  return <Card className={styles.loginCard}>
    <h1 className={styles.title}>{t(`auth.${kind}.title`)}</h1>
    <p className={styles.intro}>{t(`auth.${kind}.intro`)}</p>
    {state === 'success' ? <div role="status" className={styles.success}>
      <p>{t(`auth.${kind}.success`)}</p>
      {kind === 'register' && <Button onClick={continueDemo} disabled={submitting} className={styles.submitBtn}>{t('auth.demoLogin')}</Button>}
    </div> : <form noValidate onSubmit={submit} className={styles.form}>
      {kind === 'register' && <AuthField name="name" label={t('auth.name')} autoComplete="name" error={errors.name} inputRef={nameRef} />}
      <AuthField name="email" label={t('auth.email')} type="email" autoComplete="email" error={errors.email} inputRef={emailRef} />
      {kind !== 'recovery' && <AuthField name="password" label={t('auth.password')} type="password"
        autoComplete={kind === 'login' ? 'current-password' : 'new-password'} error={errors.password} inputRef={passwordRef} />}
      {kind === 'register' && <AuthField name="confirmation" label={t('auth.confirmation')} type="password"
        autoComplete="new-password" error={errors.confirmation} inputRef={confirmationRef} />}
      {(state === 'error' || sessionError || cleanupFailed) && <p role="alert" className={styles.error}>
        {t(cleanupFailed ? 'auth.cleanupFailed' : 'auth.sessionUnavailable')}</p>}
      <Button type="submit" disabled={submitting} className={styles.submitBtn}>
        {t(submitting ? 'auth.submitting' : `auth.${kind}.submit`)}</Button>
    </form>}
    <div className={styles.links}>
      {kind === 'login' ? <><Link to="/register">{t('auth.register.title')}</Link><Link to="/forgot-password">{t('auth.recovery.link')}</Link></>
        : <Link to="/login">{t('auth.backToLogin')}</Link>}
    </div>
    <p className={styles.demoInfo}>{t('auth.formDemoNotice')} {t('auth.demoRefresh')}</p>
  </Card>;
}
