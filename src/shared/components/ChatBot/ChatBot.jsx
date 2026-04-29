import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ChatBot.module.css';

const ChatBot = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: t('chatBot.greeting') }
  ]);
  const [input, setInput] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const botResponses = {
    'order': t('chatBot.responseOrder'),
    'delivery': t('chatBot.responseDelivery'),
    'return': t('chatBot.responseReturn'),
    'payment': t('chatBot.responsePayment'),
    'default': t('chatBot.responseDefault')
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { type: 'user', text: input }]);
    
    const lowerInput = input.toLowerCase();
    let response = botResponses.default;
    
    if (lowerInput.includes('order')) response = botResponses.order;
    else if (lowerInput.includes('delivery') || lowerInput.includes('shipping')) response = botResponses.delivery;
    else if (lowerInput.includes('return')) response = botResponses.return;
    else if (lowerInput.includes('payment') || lowerInput.includes('pay')) response = botResponses.payment;
    
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: response }]);
    }, 500);
    
    setInput('');
  };

  return (
    <div className={styles.chatBot}>
      {!isOpen ? (
        <div 
          className={styles.chatToggleWrapper}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button className={styles.chatToggle} onClick={() => setIsOpen(true)}>
            💬
          </button>
          {showTooltip && <span className={styles.tooltip}>{t('chatBot.tooltip')}</span>}
        </div>
      ) : (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <span>{t('chatBot.title')}</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className={styles.chatMessages}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.message} ${styles[msg.type]}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className={styles.chatInput}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chatBot.placeholder')}
            />
            <button onClick={handleSend}>{t('chatBot.send')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;