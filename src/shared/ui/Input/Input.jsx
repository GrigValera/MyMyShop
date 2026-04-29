import React from 'react';
import styles from './Input.module.css';

const Input = React.forwardRef(({ 
  label, 
  error, 
  className = '', 
  autoComplete,
  ...props 
}, ref) => {
  const inputClasses = `${styles.input} ${error ? styles.error : ''} ${className}`;
  
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        ref={ref}
        className={inputClasses}
        autoComplete={autoComplete}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;