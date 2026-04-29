import { useTranslation } from 'react-i18next';
import styles from './AboutPage.module.css';

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.aboutPage}>
      <h1>{t('about.title')}</h1>
      <div className={styles.content}>
        <section>
          <h2>{t('about.whoWeAre')}</h2>
          <p>{t('about.whoWeAreText')}</p>
        </section>
        <section>
          <h2>{t('about.mission')}</h2>
          <p>{t('about.missionText')}</p>
        </section>
        <section>
          <h2>{t('about.values')}</h2>
          <ul>
            <li>✓ {t('about.value1')}</li>
            <li>✓ {t('about.value2')}</li>
            <li>✓ {t('about.value3')}</li>
            <li>✓ {t('about.value4')}</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;