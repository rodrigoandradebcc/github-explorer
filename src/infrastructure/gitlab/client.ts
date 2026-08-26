import axios, { type AxiosError } from 'axios';

import { DataAccessError, type DataAccessErrorKind } from '@/domain/errors/DataAccessError';

import { GITLAB_WEB_BASE_URL } from './constants';

function toKind(status: number): DataAccessErrorKind {
  if (status === 429) return 'rateLimit';
  if (status === 404) return 'notFound';
  if (status === 0) return 'network';
  return 'unknown';
}

export function toDataAccessError(error: AxiosError): DataAccessError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as Record<string, unknown> | undefined;
  const rawMessage = data?.['message'] ?? data?.['error'];
  const message = typeof rawMessage === 'string' ? rawMessage : error.message;

  return new DataAccessError(toKind(status), message);
}

export const apiClient = axios.create({
  baseURL: `${GITLAB_WEB_BASE_URL}/api/v4`,
});

const token = process.env.EXPO_PUBLIC_GITLAB_TOKEN;

apiClient.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(toDataAccessError(error)),
);
