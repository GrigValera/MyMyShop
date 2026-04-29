import styles from './Card.module.css';

const Card = ({ children, className = '', onClick }) => {
  const cardClasses = `${styles.card} ${onClick ? styles.clickable : ''} ${className}`;
  
  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;