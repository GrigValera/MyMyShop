import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  role: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.role = action.payload.role || (action.payload.email === 'admin@example.com' ? 'admin' : 'user');
      } else {
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
      }
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    restoreAuth: (state) => {
      state.loading = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.role = null;
      state.loading = false;
      state.error = null;
    },
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setUser, setLoading, setError, clearError, restoreAuth, logout, login } = authSlice.actions;
export default authSlice.reducer;