# ADR-005: Own the data-access error contract in the domain

## Status

Accepted

## Date

2026-08-26

## Context

The Axios response interceptor rejected with `ApiError`, a class declared in
`src/infrastructure/github/client.ts` carrying an HTTP `status` and an `isRateLimit` flag. The query
client and three screens needed to tell rate limiting apart from other failures, so the class had to
be reachable from outer layers.

Presentation could not import it without depending on infrastructure, so
`presentation/github/utils/isRateLimitError.ts` inspected the value structurally
(`'isRateLimit' in error`). That satisfied the dependency rule on paper while leaving the contract
undeclared: renaming the field in infrastructure type-checked cleanly, kept existing tests green,
and silently disabled the rate-limit notice at runtime.

## Decision

Declare the contract in the domain. `src/domain/errors/DataAccessError.ts` exports the error class
with a `kind` union — `rateLimit`, `notFound`, `network`, `unknown` — and the `isRateLimitError`
guard.

Infrastructure translates provider specifics into that vocabulary: `toDataAccessError` maps HTTP
status codes to a `kind`, and the interceptor rejects with the domain error. Status codes stop at
that boundary. The query client and the screens depend on the domain guard.

## Alternatives considered

### Move `ApiError` unchanged into the domain

This was rejected because `status`, 403, and 429 are HTTP vocabulary. Relocating the file would fix
the compiler gap while leaving the domain describing a transport it must not know about, and every
future non-HTTP source would have to fake a status code.

### Keep the structural check in presentation

This was rejected because the failure mode is silent. A structural check compiles against `unknown`,
so renaming or removing the underlying field produces no type error, no failing test, and a
regression visible only in production.

### Expose the error through a re-export from `application`

This was rejected because a re-export hides the direction of the dependency instead of inverting it.
The concrete type would still originate in infrastructure and flow outward through two layers.

## Consequences

- Renaming or removing an error kind now fails `type-check`.
- Screens and the query client share one guard instead of duplicating a structural check.
- HTTP status codes exist only inside `infrastructure/github`.
- A future provider or local cache reports failures in the same vocabulary.
- `presentation/github/utils/` was removed; its only file is obsolete.
