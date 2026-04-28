import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from '../features/products/api/productsApi';
import cartReducer from '../features/cart/store/cartSlice';
import authReducer from '../features/auth/store/authSlice';
import themeReducer from '../features/theme/store/themeSlice';
import saleReducer from '../features/sale/saleSlice';

export const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    cart: cartReducer,
    auth: authReducer,
    theme: themeReducer,
    sale: saleReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(productsApi.middleware),
});