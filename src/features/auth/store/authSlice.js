import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCurrentUser, logoutUser } from '../api/authService';

// Асинхронный thunk для восстановления сессии
export const restoreAuth = createAsyncThunk(
  'auth/restoreAuth',
  async (_, { rejectWithValue }) => {
    const { user, error } = await getCurrentUser();
    if (error) return rejectWithValue(error);
    if (!user) return rejectWithValue('No user found');
    return user;
  }
);

// Асинхронный thunk для выхода
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    const { error } = await logoutUser();                  
    if (error) return rejectWithValue(error);
    return null;
  }
);

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
        state.role = action.payload.role || 'user';
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
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // restoreAuth
    builder
      .addCase(restoreAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(restoreAuth.fulfilled, (state, action) => {
        // action.payload гарантированно не null (проверили в thunk)
        state.isAuthenticated = true;
        state.user = action.payload;
        state.role = action.payload.role || 'user';
        state.loading = false;
        state.error = null;
      })
      .addCase(restoreAuth.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        state.loading = false;
        state.error = null;
      });

    // logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        state.loading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        // Даже при ошибке API — разлогиниваем локально
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { setUser, setLoading, setError, clearError, login } = authSlice.actions;
export default authSlice.reducer;