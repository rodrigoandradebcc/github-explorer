# Presentation Layer and Dependency Injection Design

## Goal

Rename the UI layer from `features/` to `presentation/`, consolidate presentation-only helpers
under that boundary, and replace module-level imports of application service singletons in hooks
with dependency injection through React Context. The refactor must preserve all visible behavior,
styles, text, cache keys, and query settings.

## Architecture

The root source folders represent architectural layers. `domain/` remains dependency-free;
`application/` depends on domain ports except for its composition root; `infrastructure/`
implements those ports; and `presentation/` may consume application services, domain models, and
the design system. Expo Router route files remain in `app/` because their location is a framework
constraint.

Presentation features remain co-located by capability:

- `presentation/repositories/` contains repository components, hooks, screens, and screen tests.
- `presentation/issues/` contains issue components, hooks, screens, utilities, and screen tests.
- `presentation/github/` contains GitHub-facing presentation components and navigation helpers.
- `presentation/shared/` contains presentation-wide query keys, formatting, debounce behavior,
  and their tests.
- `presentation/di/` contains service and query providers.

The design system remains a closed root-level library. Its tests continue using
`design-system/__test-utils__/renderWithTheme.tsx` and do not depend on application services.

## Dependency Injection

`ApplicationProvider` exposes `RepoService` and `IssueService` through React Context. Production
usage falls back to the application composition root's singleton instances, while tests and other
hosts can override either service with `Partial<ApplicationServices>`. Hooks resolve their service
at render time through `useRepoService` or `useIssueService`; no presentation hook imports a
singleton directly.

The hooks are renamed to use domain-oriented terminology:

- `useSearchRepositories` becomes `useSearchRepos`.
- `useRepository` becomes `useRepoDetails`.
- `useRepositoryIssues` becomes `useRepoIssues`.

Their TanStack Query configuration and observable behavior remain unchanged.

## Query Composition

`QueryProvider` moves the production `QueryClient` configuration out of `app/_layout.tsx` and into
`presentation/di/QueryProvider.tsx`. This preserves rate-limit-aware retry behavior while ensuring
that `app/` imports only `presentation/` and `design-system/`. The provider keeps the existing
`staleTime`, retry policy, and `refetchOnWindowFocus` value unchanged.

The root composition order is:

1. `ApplicationProvider`
2. `QueryProvider`
3. `ThemeProvider`
4. the themed Expo Router stack

`ApplicationProvider` and `QueryProvider` remain separate because service injection and server
state caching have different responsibilities and testing lifecycles.

## Testing

`presentation/__test-utils__/renderWithProviders.tsx` creates a fresh `QueryClient` for every
render, disables retries, and composes `ThemeProvider`, `ApplicationProvider`, and
`QueryClientProvider`. Existing presentation screen tests migrate to this helper and update their
mock paths and hook names.

An integration test renders `SearchScreen` with an injected fake `RepoService` and does not mock
the query hook. It submits or supplies the same search interaction used by the production screen,
waits for query completion, and verifies that repository data returned by the fake appears. This
proves that context-based service resolution reaches the real hook and screen.

All existing assertions remain intact unless an import or symbol rename requires a mechanical
update. No test may be removed, skipped, or weakened.

## Error Handling

The production query retry policy continues recognizing `ApiError` and disables retry for rate
limit responses. Other failures retain the current single-retry limit. Context hooks throw a clear
error when called outside `ApplicationProvider`, making composition mistakes fail immediately.

## Delivery and Verification

After this design-only commit, implementation is split into the five requested commits: file
moves, provider creation, hook injection, tests, and documentation. Each implementation commit is
reviewed before it is created.

The final verification requires the three dependency-boundary searches to return no matches,
followed by successful type-check, lint, and test runs. The final test count must be at least the
existing 90 tests plus the new injection coverage, with no skipped suites or tests.
