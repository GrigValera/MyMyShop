import { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { retryAuth } from '../store/authSlice';

export function useSessionRetry() {
  const dispatch = useDispatch();
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);

  const run = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      await dispatch(retryAuth());
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [dispatch]);

  return { run, pending };
}
