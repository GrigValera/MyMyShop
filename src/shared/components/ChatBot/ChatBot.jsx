import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ChatBot.module.css';

export const ChatBot = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const botResponses = {
    'order': 'You can check your order status in your profile.',
    'delivery': 'Delivery usually takes 3-5 business days.',
    'return': 'You can return items within 14 days of purchase.',
    'payment': 'We accept credit cards, PayPal, and cash on delivery.',
    'default': 'Thank you for your message! Our support team will contact you soon.'
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
          {showTooltip && <span className={styles.tooltip}>Задать вопрос</span>}
        </div>
      ) : (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <span>{t('contact.chatBot')}</span>
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
              placeholder="Type your message..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};