import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <section role="alert">
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.description')}</p>
      <Link to="/products">{t('common.continue')}</Link>
    </section>
  );
};

export default NotFoundPage;
