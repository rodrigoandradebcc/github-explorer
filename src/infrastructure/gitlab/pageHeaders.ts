import type { GitLabPageDto } from './dtos';

function readHeader(headers: Record<string, unknown>, name: string): string | null {
  const value = headers[name];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function toPageDto<T>(items: T[], headers: Record<string, unknown>): GitLabPageDto<T> {
  return {
    items,
    totalHeader: readHeader(headers, 'x-total'),
    nextPageHeader: readHeader(headers, 'x-next-page'),
  };
}
