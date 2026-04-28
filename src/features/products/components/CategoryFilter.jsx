import { useTranslation } from 'react-i18next';
import { useGetCategoriesQuery } from '../api/productsApi';

export const CategoryFilter = ({ selectedCategory, onCategoryChange }) => {
  const { t } = useTranslation();
  const { data: categories = [] } = useGetCategoriesQuery();

  return (
    <div>
      <h4>{t('filter.category')}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => onCategoryChange('')}
          style={{
            background: selectedCategory === '' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: selectedCategory === '' ? 'white' : 'var(--text-primary)',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          {t('filter.all')}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            style={{
              background: selectedCategory === category ? 'var(--primary)' : 'var(--bg-secondary)',
              color: selectedCategory === category ? 'white' : 'var(--text-primary)',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};