import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from '../features/products/api/productsApi';
import cartReducer from '../features/cart/store/cartSlice';
import { loadCart, saveCart } from '../features/cart/store/cartPersistence';
import authReducer from '../features/auth/store/authSlice';
import themeReducer from '../features/theme/store/themeSlice';
import saleReducer from '../features/sale/saleSlice';

export const store = configureStore({
  preloadedState: { cart: loadCart() },
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

let previousCart = store.getState().cart;
store.subscribe(() => {
  const cart = store.getState().cart;
  if (cart !== previousCart) {
    previousCart = cart;
    saveCart(cart);
  }
});
