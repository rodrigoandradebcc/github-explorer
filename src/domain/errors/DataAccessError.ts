export type DataAccessErrorKind = 'rateLimit' | 'notFound' | 'network' | 'cancelled' | 'unknown';

export class DataAccessError extends Error {
  readonly kind: DataAccessErrorKind;

  constructor(kind: DataAccessErrorKind, message: string) {
    super(message);
    this.name = 'DataAccessError';
    this.kind = kind;
  }
}

export function isRateLimitError(error: unknown): boolean {
  return error instanceof DataAccessError && error.kind === 'rateLimit';
}

export function isCancelledError(error: unknown): boolean {
  return error instanceof DataAccessError && error.kind === 'cancelled';
}
