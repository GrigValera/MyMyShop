import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './AuthField.module.css';

export default function AuthField({ name, label, type = 'text', autoComplete, error, inputRef }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const errorId = `${name}-error`;
  return <div className={styles.field}>
    <label htmlFor={name}>{label}</label>
    <div className={styles.inputWrap}>
      <input id={name} name={name} ref={inputRef} type={isPassword && visible ? 'text' : type}
        autoComplete={autoComplete} aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined} autoCapitalize="none" spellCheck={false}
        className={`${styles.input} ${isPassword ? styles.passwordInput : ''} ${error ? styles.invalid : ''}`} />
      {isPassword && <button type="button" className={styles.visibility} aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
        aria-controls={name} aria-pressed={visible} onClick={() => setVisible(!visible)}>{t(visible ? 'auth.hide' : 'auth.show')}</button>}
    </div>
    {error && <span id={errorId} className={styles.error} role="alert">{t(`auth.validation.${error}`)}</span>}
  </div>;
}
