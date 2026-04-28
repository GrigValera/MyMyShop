import styles from './ToggleSwitch.module.css';

export const ToggleSwitch = ({ checked, onChange, labelLeft, labelRight }) => {
  return (
    <label className={styles.switch}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={styles.input}
      />
      <span className={styles.slider}>
        <span className={`${styles.label} ${!checked ? styles.active : ''}`}>
          {labelLeft}
        </span>
        <span className={`${styles.label} ${checked ? styles.active : ''}`}>
          {labelRight}
        </span>
        <span className={styles.knob}></span>
      </span>
    </label>
  );
};