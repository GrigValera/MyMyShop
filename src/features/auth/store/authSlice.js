import { createSlice } from '@reduxjs/toolkit';
import { cleanupBrowserCredentials, DEMO_USER } from '../api/authService';

const authSlice = createSlice({
  name: 'auth',
  initialState: { isDemoSession: false, user: null, cleanupFailed: false },
  reducers: {
    started(state, action) {
      state.cleanupFailed = !action.payload;
      state.isDemoSession = action.payload;
      state.user = action.payload ? DEMO_USER : null;
    },
    ended(state, action) {
      state.isDemoSession = false;
      state.user = null;
      state.cleanupFailed = !action.payload;
    },
  },
});

export const loginDemo = () => (dispatch) => {
  dispatch(authSlice.actions.started(cleanupBrowserCredentials()));
};
export const logout = () => (dispatch) => {
  dispatch(authSlice.actions.ended(cleanupBrowserCredentials()));
};
export const restoreAuth = logout;
export default authSlice.reducer;
