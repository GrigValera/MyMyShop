import styles from './Card.module.css';

const Card = ({ children, className = '', onClick, staticSurface = false }) => {
  const cardClasses = `${styles.card} ${onClick ? styles.clickable : ''} ${staticSurface ? styles.staticSurface : ''} ${className}`;
  
  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
