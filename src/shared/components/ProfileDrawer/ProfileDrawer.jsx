import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogout } from '../../../features/auth/model/useLogout';
import LogoutFeedback from '../../../features/auth/components/LogoutFeedback';
import { useAccountProfile } from '../../../features/account/model/useAccountProfile';
import AccountAvatar from '../../../features/account/components/AccountAvatar';
import styles from './ProfileDrawer.module.css';

const ProfileDrawer = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signOut = useLogout(() => { onClose(); navigate('/'); });
  const profile = useAccountProfile();

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h3>{t('profile.drawerTitle')}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>
        <div className={styles.content}>
          <div className={styles.userInfo}>
            <AccountAvatar profile={profile} className={styles.avatar} />
            <div>
              <p className={styles.userName}>{profile.displayName}</p>
              <p>{t('auth.demoNotice')}</p>
              <p>{t('auth.demoRefresh')}</p>
            </div>
          </div>
          <div className={styles.menu}>
            <Link to="/account" className={styles.menuItem} onClick={onClose}>
              {t('account.title')}
            </Link>

          </div>
          <button className={styles.logoutBtn} onClick={signOut.run} disabled={signOut.pending}>
            {t(signOut.pending ? 'auth.submitting' : 'nav.logout')}
          </button>
          {signOut.error && <LogoutFeedback />}
        </div>
      </div>
    </>
  );
};

export default ProfileDrawer;
