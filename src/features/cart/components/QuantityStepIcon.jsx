const QuantityStepIcon = ({ direction }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M5 12h14" />
    {direction === 'increase' && <path d="M12 5v14" />}
  </svg>
);

export default QuantityStepIcon;
