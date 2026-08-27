# ADR-010: Wire everything at the root and enforce the boundaries in lint

## Status

Accepted

## Date

2026-08-27

## Context

`ApplicationProvider` and `DataSourceProvider` each imported the concrete singletons from
`@/infrastructure/di` as default prop values, and `QueryProvider` imported `createQueryClient`
directly. §3 allows that inside `presentation/di/`, so the code was legal — but three consequences
followed.

A provider that knows a default implementation is a service locator wearing a provider's clothes:
the wiring lives in two places, and the layer that must not know infrastructure knows the container's
export names.

The defaults were also silent. A test that forgot to inject a service did not fail — it fell through
to the production container and its real Axios clients.

Finally, the exception had a cost beyond itself. Any rule expressing §3 needed
`ignores: ['src/presentation/di/**']`, and an enforcement rule with a carve-out is the one people
learn to widen.

Nothing enforced §3 at all: it was checked by greps in §10 that a reviewer had to remember to run.
`import { apiClient } from '@/infrastructure/github/client'` inside a use case passed `type-check`
and `lint`.

## Decision

Every provider takes its dependency as a required prop. `ApplicationProvider` takes `services`,
`DataSourceProvider` takes `selection`, `QueryProvider` takes `createClient`. `app/_layout.tsx` — the
composition root — imports the container and passes all of them. `src/presentation/` now contains
zero imports from `@/infrastructure`.

A missing service is an error, not a fallback: `useRepoService` and `useIssueService` throw naming
the service and the provider.

§3 is enforced by `no-restricted-imports` in `eslint.config.js`, one block per layer, each message
citing the rule document. `presentation/` is restricted with no `ignores`, and is additionally barred
from importing `axios` and AsyncStorage directly, which is §1.5 stated as a rule the compiler runs.

`npm run verify` runs type-check, lint and tests together.

## Alternatives considered

### Keep the defaults and add the lint rule with a carve-out for `presentation/di/`

This was rejected because the carve-out is the part that erodes. Removing the defaults first costs
one prop per provider and leaves a rule with no exception to argue about.

### Give `renderWithProviders` a fake service pair as its default

This was rejected because it reintroduces the silent fallback in the place it hurts most. Tests that
mock their hook never ask for a service; tests that need one already inject it. A test that asks for
a service it did not provide now says so.

### Use `eslint-plugin-boundaries` or `import/no-restricted-paths`

This was rejected as an unnecessary dependency. `no-restricted-imports` is built in, and the layer
map is five globs — it does not need a plugin that models layers.

## Consequences

- Wiring exists in exactly one file, `app/_layout.tsx`, alongside the storage adapters it already
  injected.
- A test that forgets to inject a service fails with a named error instead of reaching the network.
- A cross-layer import is a lint error at the moment it is typed, and the message names the section
  it violates.
- The rule reads `import` only. A dynamic `require()` still escapes it; §10 keeps a grep for that.
- Adding a provider means adding a prop at the root, not a default inside the provider.
