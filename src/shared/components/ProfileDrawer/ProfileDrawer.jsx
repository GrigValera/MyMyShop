import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../features/auth/store/authSlice';
import { UserIcon } from '../../icons/UserIcon';
import styles from './ProfileDrawer.module.css';

const ProfileDrawer = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role } = useSelector((state) => state.auth);

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
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.content}>
          <div className={styles.userInfo}>
            <UserIcon className={styles.avatar} />
            <div>
              <p className={styles.userName}>{user?.name || user?.email || 'User'}</p>
              <p className={styles.userEmail}>{user?.email}</p>
              <span className={styles.userRole}>{role === 'admin' ? 'Administrator' : 'User'}</span>
            </div>
          </div>
          <div className={styles.menu}>
            <Link to="/profile" className={styles.menuItem} onClick={onClose}>
              {t('profile.myProfile')}
            </Link>
            <Link to="/orders" className={styles.menuItem} onClick={onClose}>
              {t('profile.myOrders')}
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