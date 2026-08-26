import axios, { type AxiosError } from 'axios';

export class ApiError extends Error {
  readonly status: number;
  readonly isRateLimit: boolean;

  constructor(status: number, message: string, isRateLimit = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isRateLimit = isRateLimit;
  }
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
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, unknown> | undefined;
    const message = typeof data?.['message'] === 'string' ? data['message'] : error.message;
    return Promise.reject(new ApiError(status, message, status === 403 || status === 429));
  },
);
