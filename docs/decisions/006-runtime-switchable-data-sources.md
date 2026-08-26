# ADR-006: Route runtime-switchable data sources at a single decision point

## Status

Accepted

## Date

2026-08-26

## Context

The application must let the user switch between two equivalent public data sources — GitHub and
GitLab — at runtime, without restarting the app, remounting screens, or changing any UI code. The
two APIs disagree on almost every surface detail: field names (`stargazers_count` versus
`star_count`), concept vocabulary (`number` versus `iid`, `state: open` versus `opened`), repository
addressing (`owner/repo` path segments versus a numeric project id or a URL-encoded full path),
label shape (objects carrying colors versus plain strings), and pagination transport (a
`total_count` field in the body versus `x-total` and `x-next-page` response headers).

The architecture at the time had one provider folder, `infrastructure/github`, wired straight into
the composition root, GitHub-shaped TanStack Query keys, and GitHub-branded copy and components in
presentation. Nothing in the code expressed the idea of "a data source" as a first-class concept, so
there was no place for a second one to attach.

## Decision

Declare the source vocabulary in the domain. `domain/shared/DataSource.ts` exports
`DATA_SOURCE_IDS` and the `DataSourceId` union; `DataSourceSelection` is an observable holder of the
active id with a `subscribe`/`set` pair; `DataSourcePreferenceStorage` is the persistence port.
These are pure TypeScript with no imports beyond each other, and they are the contract that
infrastructure, presentation, and storage share.

Give GitLab its own provider folder mirroring GitHub's. `infrastructure/gitlab` holds an Axios
client that translates GitLab failures into the domain `DataAccessError` established by
[ADR-005](./005-domain-owned-error-contract.md), the DTOs, the datasource ports and their Axios
implementations, and the repository adapters that map GitLab vocabulary into the existing domain
entities. The two clients translate differently where the providers differ: GitHub maps both 403 and
429 to `rateLimit`, while GitLab maps only 429, because a GitLab 403 is an authorization failure and
not a limit. GitLab resolves a repository by its URL-encoded full path, so the domain identity stays
the `owner`/`name` pair and the routes are unchanged.

Make the switch a single data lookup. The composition root constructs both provider stacks into a
`DataSourceRegistry`, typed as `Record<DataSourceId, { repositories, issues }>`, and hands the
application layer `SourceRoutedRepositoryRepository` and `SourceRoutedIssueRepository`. Each of
those implements a domain port and resolves `registry[activeSource()]` per call. Use cases,
services, hooks, and screens never learn that a second source exists, and the compiler reports the
missing entry when a new id is added to `DATA_SOURCE_IDS`.

Integrate with React through `presentation/di/DataSourceProvider`, which exposes the container's
selection with `useSyncExternalStore` and persists changes through the storage port — AsyncStorage
in production, mirroring the theme-preference pattern of
[ADR-004](./004-infrastructure-boundaries.md). Every query key in `presentation/shared/queryKeys.ts`
carries the source as an opaque scope, so switching changes the keys, produces a fresh fetch with
the ordinary loading states, and keeps the previous source's cache for an instant switch back.

Make the fields GitLab cannot supply explicitly nullable in the domain — `watchersCount`,
`subscribersCount`, `networkCount`, `size` and `defaultBranch` on `RepositoryDetails`,
`avatarUrl` on `Owner`, and `color` on `IssueLabel` — and let the UI degrade uniformly through a
conditional stat, an avatar initials fallback, and a neutral badge tone, without branching on the
source anywhere.

## Alternatives considered

### Rebuild the composition root when the source changes

Swapping the service singletons at runtime was rejected because React would have to remount the
providers to pick up the new instances, dropping the query cache and any in-flight state. That is
the reload the requirement explicitly forbids.

### Select the service per source inside hooks or a presentation context

Choosing between a GitHub and a GitLab service inside `useSearchRepos` was rejected because it
spreads the decision across every hook and makes presentation aware of which sources exist. The
requirement asks for one decision in one place, and per-call routing in the composition root
delivers it.

### One datasource class with conditionals per method

A single `AxiosRepositoryDataSource` branching on the active source inside each method was rejected
because it mixes both wire formats in one file. It defeats per-provider encapsulation and turns
every new source into an edit inside every existing method rather than a new folder.

### Carry the GitLab numeric project id in routes and entities

Routing by numeric project id was rejected because it needs source-conditional route construction
and a source-shaped domain identity. The URL-encoded full path is documented, works unauthenticated,
and keeps `owner`/`name` meaningful for both providers.

### Request label details from GitLab with `with_labels_details=true`

Adding the parameter would return label colors, but it was rejected because the contract must
tolerate a source that genuinely lacks a field. Making `IssueLabel.color` nullable handles every
future source, and the neutral badge tone is a uniform, honest degradation rather than a
provider-specific patch.

## Consequences

- Adding a source is a new `infrastructure/<provider>` folder, one id in `DATA_SOURCE_IDS`, one
  registry entry, and one label in the toggle's map. The compiler lists the gaps.
- `SearchReposUseCase`, `GetRepoDetailsUseCase`, and `ListRepoIssuesUseCase` are unchanged and
  identical for both sources. GitLab's issues endpoint never returns merge requests, so the
  pull-request filter is a harmless no-op there.
- Both adapters produce the same `Page<T>`. GitLab's header-based totals may be absent, which
  `total: number | null` already models.
- Query cache entries are namespaced per source, so switching back is instant within `staleTime`.
- Presentation no longer has a `github/` folder; its shared error state and navigation options moved
  to `presentation/shared/`, and the rate-limit copy is source-neutral.
- `encodeURIComponent` on route segments makes the pushed string correct, and expo-router matches
  that string while it is still encoded, so a GitLab namespace containing `/` (a nested subgroup
  such as `grupo/subgrupo`) does reach `[owner]/[repo]` with `owner === 'grupo/subgrupo'`. In
  expo-router 6.0.23, `getUrlWithReactNavigationConcessions` derives the path to match from
  `new URL(path, 'file:').pathname`, which preserves `%2F`; `configRegExp` compiles a `:param`
  segment to `([^/]+\/)`, which `grupo%2Fsubgrupo/` satisfies as one segment; and the match result
  is decoded only afterwards, by `safelyDecodeURIComponent` in `getStateFromPath`, with
  `useLocalSearchParams` decoding once more (idempotent for an already-decoded value). This was
  verified by reading the router's matching code and driving its `getStateFromPath` with the app's
  route patterns, not by an end-to-end run on a device. No custom separator or double-encoding was
  added, and none is needed: either would leak source-specific knowledge into presentation, which
  the requirement forbids.
- The `github` prefix in the persisted storage keys (`@github_explorer/*`) and the package name
  remain, so existing preferences keep resolving.
