# ADR-008: Name the repository entity `Repo`

## Status

Accepted

## Date

2026-08-27

## Context

The domain entity was `Repository` and the naming convention for a repository port is
`<Entidade>Repository` (§7). Applied to this entity the convention produced `RepositoryRepository`,
and from there `GitHubRepositoryRepository`, `SourceRoutedRepositoryRepository`, and
`GitHubRepositoryDataSource` — names in which the two occurrences of the word mean different things:
the entity, and the Repository pattern.

The stutter was not the only cost. The application and presentation layers had already settled on a
different word for the same concept — `RepoService`, `SearchReposUseCase`, `GetRepoDetailsUseCase`,
`useSearchRepos`, `useRepoDetails`, `repoService`, and every local `repo` variable. One concept
carried two names depending on the layer, and neither the compiler nor a reviewer had a reason to
prefer one.

## Decision

The entity is `Repo`, with `RepoDetails` for the detail projection. The port is `RepoRepository`; the
adapters are `GitHubRepoRepository` and `GitLabRepoRepository`; the datasource ports are
`GitHubRepoDataSource` and `GitLabRepoDataSource`; the router is `SourceRoutedRepoRepository`. The
registry entry key is `repos`. The GitHub mappers are `mapRepo` and `mapRepoDetails`.

Provider vocabulary is untouched: `GitHubRepositoryDto`, `GitHubRepositoryDetailsDto`,
`GitHubSearchRepositoriesResponseDto`, the datasource methods `searchRepositories` and
`getRepository`, and the URL `/search/repositories` all keep GitHub's word. That asymmetry is the
point — the provider dialect is allowed up to the mapper and stops there (§5.5).

Directory names stay `repositories/`; they name the module, not the entity. `IssueRepository`,
`findOpenByRepository`, and user-facing strings like `'Repository owner is required.'` are unaffected.

## Alternatives considered

### Keep `Repository` and accept the stutter

This was rejected because it also meant keeping two names for one concept. `RepositoryRepository`
alone is survivable; `Page<Repository>` returned by `SearchReposUseCase` inside `RepoService` is the
part that makes a reader check whether they are the same type.

### Rename the port suffix instead of the entity

Dropping `<Entidade>Repository` for this one port — `RepoCatalog`, `RepositorySource` — would leave
`IssueRepository` on the old convention and make §7 describe a rule with one exception. The
convention is worth more than the single name it collides with.

### Rename the entity to `Project`

This was rejected because it adopts GitLab's word for a domain the app names after GitHub's, and it
would collide again the day a third provider uses a third word. `Repo` is the term already used
throughout the codebase and by both providers' users.

## Consequences

- One word for the concept from `domain/entities/Repo.ts` up to `useSearchRepos`.
- `RepoRepository` still repeats a root, but the two words now denote entity and pattern rather than
  the same noun twice.
- ADRs 001–006 reference the old symbol names; they are dated records and were left unchanged.
- Renaming is a compile-time-checked change end to end — `type-check` covers it, and no runtime
  string moved except the registry key, which `containerWiring.test.ts` pins.
