import { CanceledError, type AxiosError } from 'axios';

import { DataAccessError } from '@/domain/errors/DataAccessError';

import { toDataAccessError } from '../client';

function axiosErrorWith(status: number | undefined, data?: unknown): AxiosError {
  return {
    message: 'Request failed',
    response: status === undefined ? undefined : { status, data },
  } as AxiosError;
}

describe('toDataAccessError', () => {
  it('returns a DataAccessError', () => {
    expect(toDataAccessError(axiosErrorWith(500))).toBeInstanceOf(DataAccessError);
  });

  it.each([
    [403, 'rateLimit'],
    [429, 'rateLimit'],
    [404, 'notFound'],
    [500, 'unknown'],
    [422, 'unknown'],
  ])('maps status %i to kind %s', (status, kind) => {
    expect(toDataAccessError(axiosErrorWith(status)).kind).toBe(kind);
  });

  it('maps a missing response to the network kind', () => {
    expect(toDataAccessError(axiosErrorWith(undefined)).kind).toBe('network');
  });

  it('prefers the GitHub message over the axios message', () => {
    const error = toDataAccessError(axiosErrorWith(404, { message: 'Not Found' }));

    expect(error.message).toBe('Not Found');
  });

  it('falls back to the axios message when the payload has none', () => {
    expect(toDataAccessError(axiosErrorWith(500, {})).message).toBe('Request failed');
  });

  it('maps an aborted request to the cancelled kind instead of a transport failure', () => {
    const error = toDataAccessError(new CanceledError('canceled') as AxiosError);

    expect(error).toBeInstanceOf(DataAccessError);
    expect(error.kind).toBe('cancelled');
  });
});
