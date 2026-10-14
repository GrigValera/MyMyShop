import { useSyncExternalStore } from 'react';
import { accountService } from '../api/accountService';

export function useAccountProfile() {
  return useSyncExternalStore(accountService.subscribe, accountService.getSnapshot);
}
