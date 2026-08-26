import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/infrastructure/github/client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.isRateLimit) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}
