import { QueryClient } from '@tanstack/react-query';

import { isCancelledError, isRateLimitError } from '@/domain/errors/DataAccessError';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          if (isRateLimitError(error)) return false;
          if (isCancelledError(error)) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}
