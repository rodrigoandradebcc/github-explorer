export function isRateLimitError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isRateLimit' in error &&
    error.isRateLimit === true
  );
}
