import { useTranslation } from 'react-i18next';
import styles from './DeliveryPage.module.css';

export const DeliveryPage = () => {
  const { t } = useTranslation();

  const deliverySteps = [
    { step: 1, title: t('delivery.step1Title'), description: t('delivery.step1Desc') },
    { step: 2, title: t('delivery.step2Title'), description: t('delivery.step2Desc') },
    { step: 3, title: t('delivery.step3Title'), description: t('delivery.step3Desc') },
    { step: 4, title: t('delivery.step4Title'), description: t('delivery.step4Desc') },
  ];

  const deliveryOptions = [
    { name: t('delivery.optionCourier'), price: 5.99, time: t('delivery.timeCourier') },
    { name: t('delivery.optionPost'), price: 2.99, time: t('delivery.timePost') },
    { name: t('delivery.optionPickup'), price: 0, time: t('delivery.timePickup') },
  ];

  return (
    <div className={styles.deliveryPage}>
      <h1>{t('delivery.title')}</h1>
      
      <section className={styles.steps}>
        <h2>{t('delivery.howItWorks')}</h2>
        <div className={styles.stepsGrid}>
          {deliverySteps.map((step) => (
            <div key={step.step} className={styles.stepCard}>
              <div className={styles.stepNumber}>{step.step}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.options}>
        <h2>{t('delivery.options')}</h2>
        <div className={styles.optionsGrid}>
          {deliveryOptions.map((option) => (
            <div key={option.name} className={styles.optionCard}>
              <h3>{option.name}</h3>
              <p className={styles.optionPrice}>{option.price === 0 ? t('delivery.free') : `$${option.price}`}</p>
              <p className={styles.optionTime}>{option.time}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.info}>
        <h2>{t('delivery.additionalInfo')}</h2>
        <p>{t('delivery.additionalText')}</p>
      </section>
    </div>
  );
};