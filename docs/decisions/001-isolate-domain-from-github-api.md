# ADR-001: Isolate the domain from the GitHub API

## Status

Accepted

## Date

2026-08-25

## Context

The UI previously consumed GitHub response types directly. API field names such as
`stargazers_count`, transport details such as `pull_request`, and string timestamps therefore
propagated through hooks, screens, and components. This coupled the application's core model to
one external provider and made filtering and normalization presentation concerns.

## Decision

Keep entities and repository interfaces in `src/domain`, with no imports from external packages
or outer application layers. Put GitHub DTOs, Axios configuration, mappers, and concrete repository
implementations in `src/infrastructure/github`.

Infrastructure converts snake_case DTOs to provider-independent, camelCase domain entities.
Features depend on domain-shaped results. Application-layer orchestration was introduced later in
[ADR-002](./002-application-layer-use-cases.md).

Within GitHub infrastructure, Axios datasources are limited to paths, request parameters, and raw
DTOs. Concrete repository adapters receive those datasources through constructors and retain DTO
mapping and pagination. Pull-request filtering and re-pagination remain application orchestration
as established by ADR-002.

## Alternatives considered

### Move the existing API types into `domain`

This would be a small change, but the domain would continue to mirror GitHub's wire format and
would not be independent.

### Keep API functions and introduce only mappers

This would prevent DTO leakage but would not define ports for replacing or testing data providers.
Repository interfaces make that boundary explicit without adding a use-case layer the application
does not currently need.

## Consequences

- UI code uses provider-independent names and real `Date` values.
- GitHub-specific response changes are contained in infrastructure DTOs and mappers.
- Provider-specific records are identified during mapping so application rules can handle them.
- Adding another provider requires implementing the domain repositories.
- Concrete GitHub adapters implement the domain repository ports.
