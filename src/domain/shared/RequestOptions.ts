/**
 * Per-call options every port accepts. `AbortSignal` is a platform primitive, not transport
 * vocabulary, so the domain can name it without learning about HTTP.
 */
export interface RequestOptions {
  signal?: AbortSignal;
}
