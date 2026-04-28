import styles from './Card.module.css';

export const Card = ({ children, className = '', onClick }) => {
  const cardClasses = `${styles.card} ${onClick ? styles.clickable : ''} ${className}`;
  
  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};