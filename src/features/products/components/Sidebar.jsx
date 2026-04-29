import { useTranslation } from 'react-i18next';
import { useGetCategoriesQuery } from '../api/productsApi';
import styles from './Sidebar.module.css';

const Sidebar = ({ selectedCategory, onCategoryChange, sortBy, onSortChange, searchQuery, onSearchChange }) => {
  const { t } = useTranslation();
  const { data: categories = [] } = useGetCategoriesQuery();

  const sortOptions = [
    { value: 'default', label: t('filter.default') },
    { value: 'asc', label: t('filter.asc') },
    { value: 'desc', label: t('filter.desc') },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}> {t('filter.search')}</h4>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={t('filter.search')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}> {t('filter.category')}</h4>
        <div className={styles.categoryList}>
          <button
            className={`${styles.categoryBtn} ${selectedCategory === '' ? styles.active : ''}`}
            onClick={() => onCategoryChange('')}
          >
            {t('filter.all')}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryBtn} ${selectedCategory === category ? styles.active : ''}`}
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}> {t('filter.sort')}</h4>
        <div className={styles.sortOptions}>
          {sortOptions.map((option) => (
            <label key={option.value} className={styles.sortLabel}>
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={sortBy === option.value}
                onChange={() => onSortChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;