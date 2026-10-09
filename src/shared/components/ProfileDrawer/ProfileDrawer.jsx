import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectSessionUser } from '../../../features/auth/store/authSlice';
import { UserIcon } from '../../icons/UserIcon';
import styles from './ProfileDrawer.module.css';

const ProfileDrawer = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectSessionUser);

  const handleLogout = () => {
    dispatch(logout());
    onClose();
    navigate('/');
  };

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
            <UserIcon className={styles.avatar} />
            <div>
              <p className={styles.userName}>{user?.name}</p>
              <p>{t('auth.demoNotice')}</p>
              <p>{t('auth.demoRefresh')}</p>
            </div>
          </div>
          <div className={styles.menu}>
            <Link to="/account" className={styles.menuItem} onClick={onClose}>
              {t('account.title')}
            </Link>

          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileDrawer;
