import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импортируем переводы
import enTranslation from './en/translation.json';
import ruTranslation from './ru/translation.json';

// Получаем сохраненный язык из localStorage или используем русский по умолчанию
const savedLanguage = localStorage.getItem('language') || 'ru';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      ru: {
        translation: ruTranslation
      }
    },
    lng: savedLanguage,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;