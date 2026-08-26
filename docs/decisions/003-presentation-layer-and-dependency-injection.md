# ADR-003: Establish the presentation layer and inject application services

## Status

Accepted

## Date

2026-08-25

## Context

User-interface code was grouped under `src/features`, while presentation-wide hooks, query keys,
and formatters lived in separate root folders. This obscured the presentation boundary. React Query
hooks also imported application service singletons directly, coupling them to the production
composition root at module load time and forcing screen tests to mock hooks instead of injecting
service collaborators.

Expo Router requires route modules to remain under `src/app`, but those modules can stay as thin
wrappers. The root layout also owned the production `QueryClient` and imported an application error
at runtime, which prevented `app` from depending only on presentation and the design system.

## Decision

Rename `src/features` to `src/presentation` and move presentation-wide debounce, query-key,
formatting, and test utilities into `presentation/shared`. Preserve feature co-location under
`presentation/repositories`, `presentation/issues`, and `presentation/github` rather than grouping
all files globally by technical role.

Provide `RepoService` and `IssueService` through a React Context in `ApplicationProvider`.
Production composition uses the existing singleton services as defaults, while callers may inject
partial service overrides for tests. Presentation hooks resolve services through context and retain
their existing TanStack Query keys and behavior.

Keep a dedicated `QueryProvider` in presentation and compose the application, query, and theme
providers from the Expo Router root layout. [ADR-004](./004-infrastructure-boundaries.md) later
moved the production QueryClient configuration to an infrastructure factory while retaining the
React provider in presentation.

## Alternatives considered

### Keep importing the container singletons directly

This would require fewer files, but hooks would remain bound to production collaborators at module
load time. Tests would continue replacing hooks through Jest module mocks instead of exercising the
real hook-to-service data flow, and alternate hosts could not supply different services.

### Flatten presentation into global `screens/` and `components/` folders

This would make technical roles easy to locate initially, but related screens, hooks, components,
and utilities would be scattered as the application grows. Feature co-location keeps changes
bounded and avoids broad global folders with unrelated responsibilities.

### Add a dependency-injection library

A general-purpose container would add runtime configuration and an external dependency for only
two services. React Context provides the required override boundary with less indirection and fits
the React Native component lifecycle.

## Consequences

- Presentation concerns have one explicit architectural boundary while features remain
  co-located.
- Hooks no longer import production service singletons directly.
- Screen integration tests can exercise real hooks with injected service fakes.
- Expo Router route files remain thin; the root layout may import infrastructure only to inject
  concrete implementations.
- Provider composition is explicit and uses no additional dependency-injection library.
- Presentation components must be rendered under `ApplicationProvider` and `QueryClientProvider`.
