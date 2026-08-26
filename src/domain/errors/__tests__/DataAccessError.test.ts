import { DataAccessError, isRateLimitError } from '../DataAccessError';

describe('DataAccessError', () => {
  it('extends Error', () => {
    expect(new DataAccessError('notFound', 'Not Found')).toBeInstanceOf(Error);
  });

  it('stores kind and message', () => {
    expect(new DataAccessError('notFound', 'Not Found')).toMatchObject({
      name: 'DataAccessError',
      message: 'Not Found',
      kind: 'notFound',
    });
  });
});

describe('isRateLimitError', () => {
  it('is true only for the rate-limit kind', () => {
    expect(isRateLimitError(new DataAccessError('rateLimit', 'Too Many Requests'))).toBe(true);
    expect(isRateLimitError(new DataAccessError('notFound', 'Not Found'))).toBe(false);
  });

  it('rejects anything that is not a DataAccessError', () => {
    expect(isRateLimitError(new Error('boom'))).toBe(false);
    expect(isRateLimitError({ kind: 'rateLimit' })).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });
});
