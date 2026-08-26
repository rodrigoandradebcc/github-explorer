# GitHub Datasources Extraction Design

## Status and Scope

This design supersedes the unimplemented infrastructure-boundary consolidation described in the
2026-08-25 design spec. The current change is limited to extracting GitHub HTTP datasources,
injecting them into infrastructure repositories, rewriting the related tests, and updating
existing documentation. Domain, application behavior, presentation, the design system, and app
routes remain unchanged except for wiring in the existing composition root when required.

## Goal

Separate HTTP transport from repository rules without changing requests, parameters, pagination,
mapping, pull-request filtering, cache behavior, or returned domain entities. Repository tests must
exercise rules through small datasource fakes rather than Jest module mocks of the Axios client.

## Datasource Ports

Define two infrastructure-local ports:

- `GitHubRepositoryDataSource` exposes repository search and detail retrieval as raw GitHub DTOs.
- `GitHubIssueDataSource` exposes open-issue listing as raw GitHub issue DTOs.

The ports remain separate because their consumers need unrelated operations. A repository test can
therefore provide a fake containing only the methods required by that repository contract.

`GITHUB_PAGE_SIZE` moves to `infrastructure/github/constants.ts`, removing the dependency from the
issue adapter to the repository adapter. `GITHUB_SEARCH_RESULT_LIMIT` remains a private repository
pagination rule.

## Axios Implementations

`AxiosGitHubRepositoryDataSource` and `AxiosGitHubIssueDataSource` use the shared `apiClient`. Their
only responsibilities are building endpoint paths and Axios parameters and returning response
DTOs. They perform no mapping, filtering, pagination calculation, or result limiting.

The repository datasource preserves the current search `q`, `page`, and `per_page` parameters and
the current repository-detail path. The issue datasource preserves `state: 'open'`, `page`, and
`per_page` and the current issues path.

## Repository Responsibilities

`GitHubRepositoryRepository` receives `GitHubRepositoryDataSource` through its constructor. It maps
DTOs to domain entities and preserves the current next-page behavior, including GitHub's 1,000
search-result ceiling and partial-page termination.

`GitHubIssueRepository` receives `GitHubIssueDataSource` through its constructor. It maps issues,
filters pull requests through the existing domain rule, and preserves the re-pagination loop. A
page containing only pull requests advances when a next page exists and returns an empty terminal
page when it does not.

Concrete repository singleton exports are removed. The existing composition root constructs each
Axios datasource, injects it into its repository adapter, and keeps the remaining use-case and
service graph unchanged.

## Testing

Repository tests replace the `client` module mock with manual datasource fakes. Existing assertions
remain, with explicit coverage for:

- a full middle search page advancing;
- the 1,000-result search ceiling;
- a partial search page terminating;
- an issue page containing only pull requests advancing to the next page;
- a terminal pull-request-only page returning empty items without looping;
- datasource arguments for owner, repository, query, and page.

Dedicated Axios datasource tests legitimately mock `client` and verify only paths and parameters.
The client test remains unchanged. No test is removed, skipped, or weakened.

## Documentation and Verification

README documents the new files and the datasource/repository responsibility split. ADR-001 may
receive a short clarification because this is a refinement of its existing boundary, not a new
architectural decision.

Final verification requires no direct `apiClient` use outside the client, Axios datasource files,
and tests; no Jest module mock in repository tests; and no mapping, filtering, or result limiting in
Axios datasource implementations. Type-check, lint, and the complete test suite must pass with all
existing tests plus the new transport and repository-rule coverage.
