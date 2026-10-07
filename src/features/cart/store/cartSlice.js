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
      const source = product.source === 'api' ? 'api' : 'demo';
      
      const existingItem = state.items.find(item => 
        item.id === product.id && 
        (item.source || 'demo') === source &&
        item.hasDiscount === hasDiscount &&
        item.price === price
      );
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          id: product.id,
          source,
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
          (item.source || 'demo') === (action.payload.source || 'demo') &&
          item.hasDiscount === action.payload.hasDiscount &&
          item.price === action.payload.price)
      );
    },
    updateQuantity: (state, action) => {
      const { id, source = 'demo', hasDiscount, price, quantity } = action.payload;
      const item = state.items.find(item => 
        item.id === id &&
        (item.source || 'demo') === source &&
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
