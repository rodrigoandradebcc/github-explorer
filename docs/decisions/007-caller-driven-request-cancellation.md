# ADR-007: Carry caller-driven cancellation through the ports

## Status

Accepted

## Date

2026-08-27

## Context

`useSearchRepos` debounces typed input and `DataSourceProvider` can switch the active provider at
any moment. Both produce the same pattern: TanStack Query aborts the `AbortSignal` it hands to
`queryFn` as soon as a query loses its last observer, but the ports discarded that signal. Every
superseded keystroke and every source switch left an in-flight request running to completion against
a cache entry nobody would read.

On the unauthenticated GitHub search endpoint — 10 requests per minute — a five-character query typed
faster than the debounce window spends the budget on results that are thrown away, and the rate-limit
notice fires on the request the user is actually waiting for.

## Decision

Every port accepts `RequestOptions` as its last parameter, declared in
`src/domain/shared/RequestOptions.ts` with a single optional `signal: AbortSignal`. Use case inputs
carry `signal`; services take `RequestOptions`; the routed repositories, the provider adapters and
the datasource ports forward it unchanged; the Axios datasources hand it to the request config. The
three query hooks pass the signal TanStack Query already gives them.

`AbortSignal` is a platform primitive, not transport vocabulary, so naming it in the domain does not
teach the domain about HTTP — the same signal cancels a local cache read or a file-backed source.

`DataAccessErrorKind` gains `cancelled`. Both interceptors check `isCancel` before mapping status
codes, so an aborted request crosses the boundary as domain vocabulary like every other failure
(ADR-005) instead of leaking an Axios `CanceledError`. The query client stops retrying that kind.

## Alternatives considered

### Pass the signal as a bare last parameter

This was rejected because `search(query, page, signal)` fixes the shape at one value. `RequestOptions`
is the extension point for the next per-call concern — a timeout, a cache directive — without another
sweep through six layers.

### Let the aborted request keep the `network` kind

This was rejected because it conflates "the user moved on" with "the network failed". The retry
predicate would retry a request the caller already abandoned, and any screen that reaches the error
branch would blame the connection.

### Re-export the Axios `CanceledError` for callers to recognise

This was rejected for the reason ADR-005 gives: a concrete infrastructure type flowing outward
through two layers inverts nothing, and presentation would be back to structural checks.

### Cancel explicitly on the source switch with `queryClient.cancelQueries`

This was rejected because it treats one symptom. Observer-driven cancellation already covers the
switch, the debounce, and the unmount with no call site to keep in sync.

## Consequences

- A superseded search stops at the socket instead of finishing into a discarded cache entry.
- Adding a per-call concern later touches one interface, not every port signature.
- `cancelled` is a `DataAccessErrorKind`, so a new screen must decide what to do with it — a
  non-exhaustive `switch` over the union fails `type-check`.
- Adapter and use case tests now assert the signal reaches the layer below; a port that drops it
  fails a test instead of silently wasting a request.
