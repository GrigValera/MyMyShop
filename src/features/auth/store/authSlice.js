import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  user: null,
  role: null, // 'user', 'admin', или null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      const { email, role } = action.payload;
      state.isAuthenticated = true;
      state.user = { email };
      state.role = role;
      localStorage.setItem('auth', JSON.stringify({ email, role }));
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.role = null;
      localStorage.removeItem('auth');
    },
    restoreAuth: (state) => {
      const savedAuth = localStorage.getItem('auth');
      if (savedAuth) {
        const { email, role } = JSON.parse(savedAuth);
        state.isAuthenticated = true;
        state.user = { email };
        state.role = role;
      }
    },
  },
});

export const { login, logout, restoreAuth } = authSlice.actions;
export default authSlice.reducer;