import { useTranslation } from 'react-i18next';
import { Input } from '../../../shared/ui';

export const SearchInput = ({ value, onChange }) => {
  const { t } = useTranslation();
  
  return (
    <Input
      type="text"
      placeholder={t('filter.search')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};