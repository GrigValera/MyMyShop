import { Component, lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import MainLayout from '../shared/layouts/MainLayout/MainLayout';
import HomePage from '../pages/HomePage/HomePage';
import LoginPage from '../pages/LoginPage/LoginPage';
import RegisterPage from '../pages/RegisterPage/RegisterPage';
import { restoreAuth } from '../features/auth/store/authSlice';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage/NotFoundPage';
import { Loader } from '../shared/ui';
import styles from './App.module.css';

// Страницы с отложенной загрузкой
const ProductsPage = lazy(() => import('../pages/ProductsPage/ProductsPage'));
const ProductDetailsPage = lazy(() => import('../pages/ProductDetailsPage/ProductDetailsPage'));
const CartPage = lazy(() => import('../pages/CartPage/CartPage'));
const AboutPage = lazy(() => import('../pages/AboutPage/AboutPage'));
const DeliveryPage = lazy(() => import('../pages/DeliveryPage/DeliveryPage'));
const ContactPage = lazy(() => import('../pages/ContactPage/ContactPage'));

class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Page render failed:', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <section className={styles.loadError} role="alert">
          <h1>{this.props.title}</h1>
          <p>{this.props.description}</p>
          <button type="button" onClick={() => window.location.reload()}>{this.props.reload}</button>
        </section>
      );
    }
    return this.props.children;
  }
}

const LazyPage = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <PageErrorBoundary
      key={location.pathname}
      title={t('pageError.title')}
      description={t('pageError.description')}
      reload={t('pageError.reload')}
    >
      <Suspense fallback={<Loader fullPage />}>{children}</Suspense>
    </PageErrorBoundary>
  );
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route 
          path="products" 
          element={
            <LazyPage>
              <ProductsPage />
            </LazyPage>
          } 
        />
        <Route 
          path="product/:id" 
          element={
            <LazyPage>
              <ProductDetailsPage />
            </LazyPage>
          } 
        />
        <Route 
          path="cart" 
          element={
            <LazyPage>
              <CartPage />
            </LazyPage>
          } 
        />
        <Route path="checkout" element={<Navigate to="/cart" replace />} />
        <Route 
          path="about" 
          element={
            <LazyPage>
              <AboutPage />
            </LazyPage>
          } 
        />
        <Route 
          path="delivery" 
          element={
            <LazyPage>
              <DeliveryPage />
            </LazyPage>
          } 
        />
        <Route 
          path="contact" 
          element={
            <LazyPage>
              <ContactPage />
            </LazyPage>
          } 
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
