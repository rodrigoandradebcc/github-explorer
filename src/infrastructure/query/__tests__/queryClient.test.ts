import { ApiError } from '@/infrastructure/github/client';

import { createQueryClient } from '../queryClient';

describe('createQueryClient', () => {
  it('creates clients with the production query defaults', () => {
    const options = createQueryClient().getDefaultOptions().queries;
    const retry = options?.retry as (failureCount: number, error: Error) => boolean;

    expect(options).toMatchObject({
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    });
    expect(retry(0, new ApiError(429, 'rate limit', true))).toBe(false);
    expect(retry(0, new Error('network'))).toBe(true);
    expect(retry(1, new Error('network'))).toBe(false);
  });

  it('returns an isolated client on every call', () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});
