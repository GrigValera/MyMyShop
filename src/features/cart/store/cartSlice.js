import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, price, originalPrice, hasDiscount, discountPercent } = action.payload;
      
      const existingItem = state.items.find(item => 
        item.id === product.id && 
        item.hasDiscount === hasDiscount &&
        item.price === price
      );
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          id: product.id,
          title: product.title,
          image: product.image,
          category: product.category,
          price: price,
          originalPrice: originalPrice || price,
          hasDiscount: hasDiscount || false,
          discountPercent: discountPercent || 0,
          quantity: 1,
        });
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => 
        !(item.id === action.payload.id && 
          item.hasDiscount === action.payload.hasDiscount &&
          item.price === action.payload.price)
      );
    },
    updateQuantity: (state, action) => {
      const { id, hasDiscount, price, quantity } = action.payload;
      const item = state.items.find(item => 
        item.id === id && 
        item.hasDiscount === hasDiscount && 
        item.price === price
      );
      if (item) {
        item.quantity = quantity;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;