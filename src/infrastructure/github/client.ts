import axios, { isCancel, type AxiosError } from 'axios';

import { DataAccessError, type DataAccessErrorKind } from '@/domain/errors/DataAccessError';

function toKind(status: number): DataAccessErrorKind {
  if (status === 403 || status === 429) return 'rateLimit';
  if (status === 404) return 'notFound';
  if (status === 0) return 'network';
  return 'unknown';
}

export function toDataAccessError(error: AxiosError): DataAccessError {
  if (isCancel(error)) return new DataAccessError('cancelled', error.message);

  const status = error.response?.status ?? 0;
  const data = error.response?.data as Record<string, unknown> | undefined;
  const message = typeof data?.['message'] === 'string' ? data['message'] : error.message;

  return new DataAccessError(toKind(status), message);
}

export const apiClient = axios.create({
  baseURL: 'https://api.github.com',
  headers: { Accept: 'application/vnd.github.v3+json' },
});

const token = process.env.EXPO_PUBLIC_GITHUB_TOKEN;

apiClient.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(toDataAccessError(error)),
);
