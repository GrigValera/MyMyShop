import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '../../shared/ui';
import { updateProfile } from '../../features/auth/api/authService';
import { setUser, setError, clearError } from '../../features/auth/store/authSlice';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isAuthenticated, user, error, loading } = useSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');

  // Защита от неавторизованных пользователей
  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className={styles.notFound}>
        <p>{t('common.error')}</p>
      </div>
    );
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    
    const { user: updatedUser, error: updateError } = await updateProfile({ name });
    
    if (updateError) {
      dispatch(setError(updateError));
    } else if (updatedUser) {
      dispatch(setUser(updatedUser));
      setIsEditing(false);
    }
  };

  return (
    <div className={styles.profilePage}>
      <h1>{t('profile.title')}</h1>
      
      <div className={styles.profileContent}>
        <Card className={styles.profileCard}>
          <h2>{t('profile.personalInfo')}</h2>
          
          {error && <p className={styles.error}>{error}</p>}
          
          {!isEditing ? (
            <div className={styles.profileInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>{t('auth.name')}:</span>
                <span>{user.name || '-'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>{t('auth.email')}:</span>
                <span>{user.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>{t('profile.role')}:</span>
                <span>{user.role === 'admin' ? 'Administrator' : 'User'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>{t('profile.memberSince')}:</span>
                <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
              </div>
              <div className={styles.actions}>
                <Button onClick={() => setIsEditing(true)} variant="primary">
                  {t('profile.edit')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className={styles.profileForm}>
              <Input
                label={t('auth.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
              <div className={styles.formActions}>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? t('common.loading') : t('profile.save')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}
        </Card>
        
        <Card className={styles.orderCard}>
          <h2>{t('profile.orderHistory')}</h2>
          <p className={styles.emptyMessage}>{t('profile.noOrders')}</p>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;