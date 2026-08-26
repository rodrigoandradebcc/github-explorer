# ADR-002: Introduce an application layer with use cases and services

## Status

Accepted

## Date

2026-08-25

## Context

React Query hooks called concrete GitHub adapters directly. This made presentation code aware of
infrastructure and left no framework-independent place for input validation, orchestration, or
business rules that span multiple repository calls. Filtering pull requests from GitHub's issues
response had consequently been implemented inside the adapter.

## Decision

Introduce `src/application` between features and the domain ports. Each operation is represented by
a class with one public `execute()` method and receives its repository port through the constructor.
Thin aggregate services group these use cases and form the stable API consumed by hooks.

Use a manual composition root to instantiate adapters, use cases, and services. It was initially
introduced under application and later moved to `infrastructure/di/container.ts` by
[ADR-004](./004-infrastructure-boundaries.md), leaving application with no infrastructure imports.
Move pull-request filtering and the associated re-pagination loop into `ListRepoIssuesUseCase`;
infrastructure only maps and returns the provider response.

## Alternatives considered

### Keep orchestration inside the react-query hooks

This would require fewer files, but hooks would continue mixing cache concerns with validation and
business orchestration. The logic would remain coupled to React and be harder to test through plain
repository fakes, so this option was rejected.

### Expose use cases directly to hooks

This removes the thin services, but makes features depend on the number and composition of current
operations. Services provide a stable aggregate-level surface for future use-case composition, so
direct exposure was rejected.

### Add a dependency-injection library

A DI container could automate object construction, but the dependency graph has only three use
cases and two adapters. Manual composition is explicit and avoids an unnecessary runtime dependency.

## Consequences

- Presentation features no longer import concrete adapters directly.
- Use cases can be tested without React Query or Axios.
- Business filtering and re-pagination live in the application layer.
- Services are intentionally thin today and can compose more use cases without changing hooks.
- The composition root is the single place that selects concrete providers.
