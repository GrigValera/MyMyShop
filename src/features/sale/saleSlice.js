import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadSaleItems } from './saleService';

export const fetchSaleItems = createAsyncThunk(
  'sale/fetchSaleItems',
  async () => {
    const items = await loadSaleItems();
    return items;
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const saleSlice = createSlice({
  name: 'sale',
  initialState,
  reducers: {
    clearSale: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSaleItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSaleItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSaleItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearSale } = saleSlice.actions;
export default saleSlice.reducer;