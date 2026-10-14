import styles from '../../../pages/AccountPage/AccountPage.module.css';
import { useTranslation } from 'react-i18next';

export default function AccountAvatar({ profile, className = '' }) {
  const { t } = useTranslation();
  return <span className={`${styles.avatar} ${className}`} aria-label={t('account.avatarFor', { name: profile.displayName })} role="img">
    {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.initials}
  </span>;
}
