import { createSlice } from '@reduxjs/toolkit';
import { sessionService } from '../api/sessionService';

const authSlice = createSlice({
  name: 'auth',
  initialState: sessionService.getInitialSession(),
  reducers: {
    sessionChanged: (_state, action) => action.payload,
  },
});

export const selectSessionStatus = (state) => state.auth.status;
export const selectHasSession = (state) => selectSessionStatus(state) !== 'anonymous';
export const selectSessionUser = (state) => state.auth.user;
export const selectSessionCleanupFailed = (state) => state.auth.cleanupFailed;
export const selectSessionError = (state) => state.auth.error;

export const startSession = () => async (dispatch) => {
  dispatch(authSlice.actions.sessionChanged(await sessionService.startSession()));
};
export const logout = () => async (dispatch) => {
  dispatch(authSlice.actions.sessionChanged(await sessionService.endSession()));
};
export const restoreAuth = () => (dispatch) => {
  dispatch(authSlice.actions.sessionChanged(sessionService.restoreSession()));
};
export default authSlice.reducer;
