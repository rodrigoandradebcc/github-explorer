import { ApiError } from '../client';

describe('ApiError', () => {
  it('extends Error', () => {
    expect(new ApiError(404, 'Not Found')).toBeInstanceOf(Error);
  });

  it('stores status and message', () => {
    const error = new ApiError(404, 'Not Found');

    expect(error).toMatchObject({
      name: 'ApiError',
      message: 'Not Found',
      status: 404,
      isRateLimit: false,
    });
  });

  it('stores the rate-limit classification', () => {
    const error = new ApiError(429, 'Too Many Requests', true);

    expect(error.isRateLimit).toBe(true);
  });
});
