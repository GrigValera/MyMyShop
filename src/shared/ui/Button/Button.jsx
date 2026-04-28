import styles from './Button.module.css';

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  disabled,
  onClick,
  type = 'button',
  ...props 
}) => {
  const buttonClasses = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};