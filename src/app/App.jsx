import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch } from "react-redux";
import { MainLayout } from "../shared/layouts/MainLayout/MainLayout";
import { HomePage } from "../pages/HomePage/HomePage";
import { ProductsPage } from "../pages/ProductsPage/ProductsPage";
import { CartPage } from "../pages/CartPage/CartPage";
import { LoginPage } from "../pages/LoginPage/LoginPage";
import { ProtectedRoute } from "../shared/components/ProtectedRoute";
import { restoreAuth } from "../features/auth/store/authSlice";
import { AboutPage } from '../pages/AboutPage/AboutPage';
import { DeliveryPage } from '../pages/DeliveryPage/DeliveryPage';
import { ContactPage } from '../pages/ContactPage/ContactPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage/ProductDetailsPage';


function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="product/:id" element={<ProductDetailsPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="delivery" element={<DeliveryPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="cart" element={<CartPage />} />
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
