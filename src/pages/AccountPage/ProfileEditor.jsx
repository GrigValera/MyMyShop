import { useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { accountService } from '../../features/account/api/accountService';
import { useAccountProfile } from '../../features/account/model/useAccountProfile';
import { MAX_DISPLAY_NAME_LENGTH, validateAvatar, validateAvatarContent, validateDisplayName } from '../../features/account/model/profileValidation';
import AccountAvatar from '../../features/account/components/AccountAvatar';
import { Button, Card } from '../../shared/ui';
import styles from './AccountPage.module.css';

export default function ProfileEditor() {
  const { t } = useTranslation();
  const sharedProfile = useAccountProfile();
  const [load, setLoad] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [touched, setTouched] = useState(false);
  const fileInput = useRef(null);
  const stayButton = useRef(null);
  const previousFocus = useRef(null);
  const previewRef = useRef(null);
  const pendingRef = useRef(false);

  const revokePreview = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreviewUrl(null);
  };

  useEffect(() => {
    let active = true;
    accountService.getProfile().then((result) => {
      if (!active) return;
      setLoad(result);
      if (result.status === 'success') setName(result.data.displayName);
    });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  const saved = load.status === 'success' ? sharedProfile : null;
  const nameError = validateDisplayName(name);
  const dirty = !!saved && (name !== saved.displayName || !!file || (removeAvatar && !!saved.avatarUrl));
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    dirty && !pendingRef.current && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (blocker.state !== 'blocked') return undefined;
    previousFocus.current = document.activeElement;
    stayButton.current?.focus();
    return () => {
      if (document.contains(previousFocus.current)) previousFocus.current?.focus();
    };
  }, [blocker.state]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const reset = () => {
    revokePreview();
    setFile(null);
    setRemoveAvatar(false);
    setFileError(null);
    setName(saved.displayName);
    setTouched(false);
    setSaveStatus('idle');
    if (fileInput.current) fileInput.current.value = '';
  };

  const chooseFile = async (event) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    let error = validateAvatar(selected);
    if (!error) {
      try { error = await validateAvatarContent(selected); }
      catch { error = 'previewFailed'; }
    }
    if (error) { setFileError(error); return; }
    let url;
    try {
      url = URL.createObjectURL(selected);
      const image = new Image();
      image.src = url;
      await image.decode();
      revokePreview();
      previewRef.current = url;
      setPreviewUrl(url);
      setFile(selected);
      setRemoveAvatar(false);
      setFileError(null);
      setSaveStatus('idle');
    } catch {
      if (url) URL.revokeObjectURL(url);
      setFileError('previewFailed');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (!dirty || nameError || fileError || pendingRef.current) return;
    pendingRef.current = true;
    setSaveStatus('saving');
    const result = await accountService.updateProfile({ displayName: name, avatarFile: file, removeAvatar });
    pendingRef.current = false;
    if (result.status === 'success') {
      revokePreview();
      setFile(null);
      setRemoveAvatar(false);
      setName(result.data.displayName);
      setLoad(result);
      setTouched(false);
      setSaveStatus('success');
    } else {
      setSaveStatus('error');
    }
  };

  if (load.status === 'loading') return <p role="status">{t('account.loading')}</p>;
  if (load.status === 'error') return <Card className={styles.stateCard}>
    <p role="alert">{t('account.unavailable')}</p>
    <Button onClick={() => { setLoad({ status: 'loading' }); setAttempt((value) => value + 1); }}>{t('common.retry')}</Button>
  </Card>;

  const shown = { ...saved, displayName: name.trim() || saved.displayName,
    avatarUrl: removeAvatar ? null : previewUrl || saved.avatarUrl };
  const hasAvatar = !!shown.avatarUrl;

  return <div className={styles.profilePage}>
    <h1>{t('account.personalData')}</h1>
      <form className={styles.profileForm} onSubmit={submit} noValidate>
        <section className={styles.profileSection} aria-labelledby="photo-title">
          <h2 id="photo-title">{t('account.profilePhoto')}</h2>
        <div className={styles.avatarEditor}>
          <AccountAvatar profile={shown} />
          <div className={styles.avatarControls}>
            <input ref={fileInput} className={styles.fileInput} id="profile-avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} disabled={saveStatus === 'saving'} aria-describedby={`avatar-help${file ? ' avatar-pending' : ''}${fileError ? ' avatar-error' : ''}`} />
            <label className={styles.fileTrigger} htmlFor="profile-avatar">{t(hasAvatar ? 'account.changeAvatar' : 'account.chooseAvatar')}</label>
            {file && <p id="avatar-pending" className={styles.pendingFile} role="status">{t('account.selectedAvatar', { name: file.name })}</p>}
            <p id="avatar-help" className={styles.help}>{t('account.avatarHelp')}</p>
            {fileError && <p id="avatar-error" className={styles.error} role="alert">{t(`account.${fileError}`)}</p>}
            {hasAvatar && <Button variant="secondary" onClick={() => { revokePreview(); setFile(null); setRemoveAvatar(true); setFileError(null); }}>{t('account.removeAvatar')}</Button>}
          </div>
        </div>
        </section>
        <section className={styles.profileSection} aria-labelledby="personal-title">
          <h2 id="personal-title">{t('account.nameAndEmail')}</h2>
        <div className={styles.field}>
          <label htmlFor="profile-name">{t('account.displayName')}</label>
          <input id="profile-name" value={name} onChange={(event) => { setName(event.target.value); setSaveStatus('idle'); }} onBlur={() => setTouched(true)} aria-invalid={!!(touched && nameError)} aria-describedby={touched && nameError ? 'name-error' : 'name-help'} />
          <p id="name-help" className={styles.help}>{t('account.nameHelp', { max: MAX_DISPLAY_NAME_LENGTH })}</p>
          {touched && nameError && <p id="name-error" className={styles.error} role="alert">{t(`account.${nameError}`, { max: MAX_DISPLAY_NAME_LENGTH })}</p>}
        </div>
        <div className={styles.field}>
          <label htmlFor="profile-email">{t('account.email')}</label>
          <input id="profile-email" value={saved.email} readOnly aria-describedby="email-help" />
          <p id="email-help" className={styles.help}>{t('account.emailHelp')}</p>
        </div>
        </section>
        <div className={styles.actions}>
          <Button type="submit" disabled={!dirty || !!nameError || !!fileError || saveStatus === 'saving'}>{t(saveStatus === 'saving' ? 'account.saving' : 'account.save')}</Button>
          <Button variant="secondary" onClick={reset} disabled={saveStatus === 'saving' || !dirty}>{t('account.cancel')}</Button>
        </div>
        <div className={styles.statusSlot}>
          {saveStatus === 'success' && <p className={styles.success} role="status">{t('account.saved')}</p>}
          {saveStatus === 'error' && <p className={styles.error} role="alert">{t('account.saveFailed')}</p>}
        </div>
      </form>
    {blocker.state === 'blocked' && <div className={styles.confirmBackdrop}>
      <div className={styles.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby="leave-title" aria-describedby="leave-description">
        <h2 id="leave-title">{t('account.unsavedTitle')}</h2>
        <p id="leave-description">{t('account.unsavedMessage')}</p>
        <div className={styles.actions}>
          <Button ref={stayButton} onClick={() => blocker.reset()}>{t('account.stay')}</Button>
          <Button variant="secondary" onClick={() => { revokePreview(); blocker.proceed(); }}>{t('account.leave')}</Button>
        </div>
      </div>
    </div>}
  </div>;
}
