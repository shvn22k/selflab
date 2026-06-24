import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      gcTime: 1000 * 60 * 60 * 24, // 24h — keep cached data for offline use
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Offline-first cache: persist the query cache to AsyncStorage so data is
 * available instantly on launch and survives being offline. */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});
