import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

export function useLogout(onSuccess) {
  const dispatch = useDispatch();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function run() {
    if (pending) return;
    setPending(true);
    setError(false);
    const result = await dispatch(logout());
    setPending(false);
    if (result.status === 'anonymous') onSuccess?.();
    else setError(true);
  }
  return { run, pending, error };
}
