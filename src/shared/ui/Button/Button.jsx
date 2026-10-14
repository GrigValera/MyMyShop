import { forwardRef } from 'react';
import styles from './Button.module.css';

const Button = forwardRef(({
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  disabled,
  onClick,
  type = 'button',
  ...props 
}, ref) => {
  const buttonClasses = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;
  
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
