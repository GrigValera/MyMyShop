import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '../../shared/ui/ToggleSwitch/ToggleSwitch';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = () => {
    const newLang = currentLanguage === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <ToggleSwitch
      checked={currentLanguage === 'en'}
      onChange={changeLanguage}
      labelLeft="RU"
      labelRight="EN"
    />
  );
};