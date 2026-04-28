import { useTranslation } from 'react-i18next';

export const SortSelect = ({ sortBy, onSortChange }) => {
  const { t } = useTranslation();

  return (
    <div>
      <h4>{t('filter.sort')}</h4>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          cursor: 'pointer'
        }}
      >
        <option value="default">{t('filter.default')}</option>
        <option value="asc">{t('filter.asc')}</option>
        <option value="desc">{t('filter.desc')}</option>
      </select>
    </div>
  );
};