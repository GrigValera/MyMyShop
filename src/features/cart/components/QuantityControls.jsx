import { useTranslation } from 'react-i18next';
import QuantityStepIcon from './QuantityStepIcon';
import styles from './QuantityControls.module.css';

const QuantityControls = ({ item, onChange }) => {
  const { t } = useTranslation();
  const identity = { id: item.id, source: item.source || 'demo', hasDiscount: item.hasDiscount, price: item.price };

  return (
    <div className={styles.controls} role="group" aria-label={t('cart.quantityFor', { title: item.title })}>
      <button
        type="button"
        className={styles.button}
        aria-label={t('cart.decreaseQuantity', { title: item.title })}
        disabled={item.quantity <= 1}
        onClick={() => onChange({ ...identity, quantity: item.quantity - 1 })}
      >
        <QuantityStepIcon direction="decrease" />
      </button>
      <output className={styles.value} aria-label={t('cart.currentQuantity', { count: item.quantity })}>
        {item.quantity}
      </output>
      <button
        type="button"
        className={styles.button}
        aria-label={t('cart.increaseQuantity', { title: item.title })}
        onClick={() => onChange({ ...identity, quantity: item.quantity + 1 })}
      >
        <QuantityStepIcon direction="increase" />
      </button>
    </div>
  );
};

export default QuantityControls;
