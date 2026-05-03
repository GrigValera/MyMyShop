import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import MainLayout from '../shared/layouts/MainLayout/MainLayout';
import HomePage from '../pages/HomePage/HomePage';
import LoginPage from '../pages/LoginPage/LoginPage';
import RegisterPage from '../pages/RegisterPage/RegisterPage';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import { restoreAuth } from '../features/auth/store/authSlice';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import { Loader } from '../shared/ui';

// Lazy loaded pages
const ProductsPage = lazy(() => import('../pages/ProductsPage/ProductsPage'));
const ProductDetailsPage = lazy(() => import('../pages/ProductDetailsPage/ProductDetailsPage'));
const CartPage = lazy(() => import('../pages/CartPage/CartPage'));
const AboutPage = lazy(() => import('../pages/AboutPage/AboutPage'));
const DeliveryPage = lazy(() => import('../pages/DeliveryPage/DeliveryPage'));
const ContactPage = lazy(() => import('../pages/ContactPage/ContactPage'));

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreAuth()); // Теперь это асинхронный thunk
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
            <Suspense fallback={<Loader fullPage />}>
              <ProductsPage />
            </Suspense>
          } 
        />
        <Route 
          path="product/:id" 
          element={
            <Suspense fallback={<Loader fullPage />}>
              <ProductDetailsPage />
            </Suspense>
          } 
        />
        <Route 
          path="cart" 
          element={
            <Suspense fallback={<Loader fullPage />}>
              <CartPage />
            </Suspense>
          } 
        />
        <Route 
          path="about" 
          element={
            <Suspense fallback={<Loader fullPage />}>
              <AboutPage />
            </Suspense>
          } 
        />
        <Route 
          path="delivery" 
          element={
            <Suspense fallback={<Loader fullPage />}>
              <DeliveryPage />
            </Suspense>
          } 
        />
        <Route 
          path="contact" 
          element={
            <Suspense fallback={<Loader fullPage />}>
              <ContactPage />
            </Suspense>
          } 
        />
        <Route path="profile" element={<ProfilePage />} />
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <div>
                <h1>Admin Panel</h1>
                <p>Only for administrators</p>
              </div>
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;