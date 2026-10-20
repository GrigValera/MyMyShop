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
export const selectHasSession = (state) => selectSessionStatus(state) === 'authenticated';
export const selectSessionUser = (state) => state.auth.user;
export const selectCanDemoSignIn = (state) => state.auth.canDemoSignIn;

export const startSession = credentials => async (dispatch) => {
  const session = await sessionService.startSession(credentials);
  if (session.status === 'authenticated') dispatch(authSlice.actions.sessionChanged(session));
  return session;
};
let logoutInFlight = null;
export const logout = () => (dispatch, getState) => {
  if (logoutInFlight) return logoutInFlight;
  const canDemoSignIn = getState().auth.canDemoSignIn;
  logoutInFlight = sessionService.endSession().then(result => {
    if (result.status === 'anonymous') dispatch(authSlice.actions.sessionChanged({ ...result, canDemoSignIn }));
    return result;
  }).finally(() => { logoutInFlight = null; });
  return logoutInFlight;
};
export const restoreAuth = () => async (dispatch) => {
  dispatch(authSlice.actions.sessionChanged(sessionService.getInitialSession()));
  dispatch(authSlice.actions.sessionChanged(await sessionService.restoreSession()));
};
export const retryAuth = () => async (dispatch, getState) => {
  if (getState().auth.status !== 'unavailable') return;
  const session = await sessionService.restoreSession();
  if (session.status !== 'unavailable') dispatch(authSlice.actions.sessionChanged(session));
};
export default authSlice.reducer;
