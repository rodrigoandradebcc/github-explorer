# Runtime-Switchable Data Sources (GitHub + GitLab) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user switch the app's data source between GitHub and GitLab at runtime — search, details, and issues behave identically on both — with the source decision made in exactly one place (the composition root) and each provider's wire format fully encapsulated in its own infrastructure folder.

**Architecture:** The domain gains a `DataSourceId` vocabulary, an observable `DataSourceSelection`, and a persistence port. A new `src/infrastructure/gitlab/` provider mirrors `src/infrastructure/github/` (client → DTOs → datasources → mappers → repository adapters). The composition root builds both provider stacks into a registry and hands the application layer **source-routed** repository adapters that resolve `registry[selection.current]` per call — use cases, services, hooks, and screens never learn a second source exists. Presentation adds a `DataSourceProvider` (mirroring the theme-storage pattern for persistence), a source scope inside every query key (so switching re-fetches via TanStack Query key change, no remount, no invalidation), and a segmented toggle in the search header.

**Tech Stack:** Expo SDK 54, expo-router, TypeScript strict, TanStack Query v5, Axios, AsyncStorage, Jest + jest-expo + @testing-library/react-native.

**Spec:** The verbatim requirement is reproduced in the [Requirement (spec)](#requirement-spec) appendix at the bottom of this document. Binding architecture rules: `docs/ARCHITECTURE-RULES.md`. Prior decisions: `docs/decisions/001-*.md` … `005-*.md`.

## Global Constraints

- Dependency table (ARCHITECTURE-RULES §3): `domain/` imports **nothing**; `application/` only `domain/`; `infrastructure/` imports `domain/` (and `application/` only in `di/container.ts`); `presentation/` imports `application/` (types), `domain/`, `design-system/` — `infrastructure/` **only** in files under `presentation/di/`; `app/` imports `presentation/`, `design-system/`, and `infrastructure/` only to inject concretes.
- Naming (§7): port `<Provider><Módulo>DataSource`, impl `<Lib><Port>` (`AxiosGitLabIssueDataSource`), repository adapter `<Provider><Entidade>Repository` (`GitLabIssueRepository`), method names say what they do (`listOpenIssues`, not `listIssues` with hidden state).
- Infra split (§6): `Axios*DataSource` = path, params, raw DTO (headers included, verbatim), **no** `map`/`Math`/page math; `*Repository` = DTO→entity mapping + `nextPage` calculation, never touches axios.
- Tests per layer (§8): domain = pure in/out, no mocks; application and `*Repository` = fakes (object literals implementing the interface), **no** `jest.mock` of modules; `Axios*DataSource` = `jest.mock('../client')` is legitimate (axios usage is the target); presentation = `renderWithProviders` with injected service fakes; design-system untouched.
- Error contract (§11): every provider translates its failures to `DataAccessError` with `kind: rateLimit | notFound | network | unknown`. GitLab's HTTP 429 must map to `rateLimit`. HTTP vocabulary never leaves the provider's `client.ts`.
- Composition: `infrastructure/di/container.ts` is the **only** place that does `new` on concretes wired into services. (Exception already in the codebase and mirrored here per user decision: `AsyncStorage*Preference` storage adapters export a singleton, injected from `app/_layout.tsx`, exactly like `asyncStorageThemePreference`.)
- Spec page size: **`per_page=20`** for both providers (spec §5). The current `GITHUB_PAGE_SIZE = 30` is changed to 20 in Task 3 — an explicit decision, see the note there.
- Never commit credentials. Tokens are optional via `.env` (`EXPO_PUBLIC_GITHUB_TOKEN`, new `EXPO_PUBLIC_GITLAB_TOKEN`).
- Every task ends green on: `npm run type-check && npm run lint && npm test`.
- Architecture greps (§10) must stay empty; Task 13 runs them as final verification.
- User decisions, not to be re-litigated: selector = segmented control in the SearchScreen header (no new route/settings screen); chosen source persists across sessions via AsyncStorage mirroring the `ThemePreferenceStorage` + `AsyncStorageThemePreference` pattern.

## The five named design decisions (summary)

1. **Single decision point:** a `DataSourceRegistry` (`Record<DataSourceId, {repositories, issues}>`) built in `src/infrastructure/di/container.ts`; `SourceRoutedRepositoryRepository` / `SourceRoutedIssueRepository` (also in `src/infrastructure/di/`) resolve `registry[activeSource()]` per call. That lookup is the only place in the codebase where "which source?" is answered. No `if (source === …)` anywhere else.
2. **Runtime switching without remount:** the container still builds singletons at module load — *both* stacks. What changes at runtime is only the `DataSourceSelection` value, read per call by the routed adapters. React reacts because the source is part of every query key: key changes → TanStack Query treats it as a new query → refetch with loading state, old source's cache retained for instant switch-back. No provider rebuild, no screen remount.
3. **Repository identity:** the source-agnostic identity is the **full path pair** (`owner` = namespace full path, `name` = project path slug), which both APIs can resolve: GitHub as `/repos/{owner}/{name}`, GitLab as `/projects/{urlencode(owner + '/' + name)}` (spec §5 allows the URL-encoded full path as `{id}`). Routes stay `/repository/[owner]/[repo]`; the only route change is URL-encoding the segments when pushing (GitLab group paths may contain `/`; encoding is a no-op for GitHub logins).
4. **Cache isolation:** every `queryKeys` factory takes a `scope: DataSourceId` first argument; hooks obtain it from `useDataSourceScope()` (an opaque cache namespace — no branching). Screens never see it.
5. **Entity parity:** fields GitLab cannot provide become explicitly nullable in the domain (`watchersCount`, `subscribersCount`, `networkCount`, `size`, `defaultBranch`, `Owner.avatarUrl`, `IssueLabel.color`; `language` and `license` were already nullable) and the UI degrades uniformly (conditional render / fallback), never by branching on source.

## File structure (what is created / modified)

```
src/domain/shared/
  DataSource.ts                       NEW  DATA_SOURCE_IDS, DataSourceId, isDataSourceId
  DataSourceSelection.ts              NEW  observable current-source holder (pure TS)
  DataSourcePreferenceStorage.ts      NEW  persistence port
  __tests__/DataSourceSelection.test.ts NEW
src/domain/entities/
  Owner.ts                            MOD  avatarUrl: string | null
  Repository.ts                       MOD  RepositoryDetails nullable stats
  Issue.ts                            MOD  IssueLabel.color: string | null
src/infrastructure/gitlab/            NEW  client, constants, dtos, pageHeaders, mappers,
                                           GitLab*DataSource (ports), AxiosGitLab*DataSource,
                                           GitLab*Repository, __tests__/
src/infrastructure/di/
  DataSourceRegistry.ts               NEW
  SourceRoutedRepositoryRepository.ts NEW
  SourceRoutedIssueRepository.ts      NEW
  __tests__/sourceRouting.test.ts     NEW
  container.ts                        MOD  registry + selection + routed adapters
  index.ts                            MOD  export dataSourceSelection
src/infrastructure/github/constants.ts MOD 30 → 20
src/infrastructure/storage/
  AsyncStorageDataSourcePreference.ts NEW  (+ test)
src/presentation/di/
  DataSourceProvider.tsx              NEW  (+ __tests__/DataSourceProvider.test.tsx)
src/presentation/shared/
  queryKeys.ts                        MOD  scope param
  components/DataAccessErrorState.tsx NEW  (replaces GithubApiErrorState, neutral copy)
  components/DataSourceToggle.tsx     NEW  (+ test)
  navigation/getStackScreenOptions.ts NEW  (replaces getGithubStackScreenOptions)
src/presentation/github/              DEL  entire folder (both files replaced above)
src/presentation/repositories/hooks/  MOD  useSearchRepos, useRepoDetails (scope)
src/presentation/issues/hooks/        MOD  useRepoIssues (scope)
src/presentation/issues/utils/labelColorToTone.ts MOD  accepts null (+ new test)
src/presentation/repositories/screens/SearchScreen.tsx        MOD  toggle, title, encoded push
src/presentation/repositories/screens/RepositoryDetailScreen.tsx MOD imports, encoded push
src/presentation/repositories/components/SearchContent.tsx    MOD  import, placeholder
src/presentation/repositories/components/RepositoryCard.tsx   MOD  avatar null
src/presentation/repositories/components/RepositoryDetailContent.tsx MOD watchers conditional, avatar null
src/presentation/issues/screens/IssuesScreen.tsx              MOD  imports
src/presentation/issues/components/IssueCard.tsx              MOD  avatar null
src/presentation/__test-utils__/renderWithProviders.tsx       MOD  DataSourceProvider
src/app/_layout.tsx                   MOD  mount DataSourceProvider + storage injection
docs/decisions/006-runtime-switchable-data-sources.md NEW
docs/ARCHITECTURE-RULES.md            MOD  structure map
README.md                             MOD
.env.example                          MOD
```

**Tests at risk from these changes (all handled inside the task that breaks them):**
- Task 3 (page size 20) breaks `src/infrastructure/github/__tests__/AxiosGitHubIssueDataSource.test.ts`, `AxiosGitHubRepositoryDataSource.test.ts`, `repositories.test.ts` → updated in Task 3.
- Task 11 (neutral copy) breaks the `EXPO_PUBLIC_GITHUB_TOKEN` assertions in `SearchScreen.test.tsx`, `IssuesScreen.test.tsx`, `RepositoryDetailScreen.test.tsx` → updated in Task 11.
- Task 9 changes `renderWithProviders`, which every presentation test uses — the change is purely additive (one more provider wrapping), verified by the full suite in Task 9.
- Tasks 2/12 touch screens whose tests mock hooks by module path; those mocks are untouched, only rendered output changes are asserted.

---

### Task 1: Domain data-source contracts

**Files:**
- Create: `src/domain/shared/DataSource.ts`
- Create: `src/domain/shared/DataSourceSelection.ts`
- Create: `src/domain/shared/DataSourcePreferenceStorage.ts`
- Test: `src/domain/shared/__tests__/DataSourceSelection.test.ts`

**Interfaces:**
- Consumes: nothing (domain imports nothing).
- Produces: `DATA_SOURCE_IDS: readonly ['github','gitlab']`; `type DataSourceId = 'github' | 'gitlab'`; `isDataSourceId(value: unknown): value is DataSourceId`; `class DataSourceSelection { constructor(initial: DataSourceId); get current(): DataSourceId; set(next: DataSourceId): void; readonly subscribe: (listener: () => void) => () => void }`; `interface DataSourcePreferenceStorage { load(): Promise<DataSourceId | null>; save(source: DataSourceId): Promise<void> }`. Every later task references these exact names.

Why a class with subscribers in `domain/`? It is pure TypeScript with zero imports (runs in plain Node, per rule 1.3), and it is the contract three outer layers share: infrastructure routes on `current`, presentation renders and sets it, storage persists it. Declaring it anywhere else forces a layering violation somewhere (ADR-005 precedent: shared contracts live in the domain). The `subscribe` member is an arrow-function property so it can be handed directly to React's `useSyncExternalStore` without re-binding.

- [ ] **Step 1: Write the failing test**

```ts
// src/domain/shared/__tests__/DataSourceSelection.test.ts
import { DATA_SOURCE_IDS, isDataSourceId } from '../DataSource';
import { DataSourceSelection } from '../DataSourceSelection';

describe('isDataSourceId', () => {
  it.each(DATA_SOURCE_IDS)('accepts %s', (id) => {
    expect(isDataSourceId(id)).toBe(true);
  });

  it.each(['bitbucket', '', null, undefined, 42])('rejects %p', (value) => {
    expect(isDataSourceId(value)).toBe(false);
  });
});

describe('DataSourceSelection', () => {
  it('starts on the provided source', () => {
    expect(new DataSourceSelection('github').current).toBe('github');
    expect(new DataSourceSelection('gitlab').current).toBe('gitlab');
  });

  it('notifies subscribers after the source changes', () => {
    const selection = new DataSourceSelection('github');
    const seen: string[] = [];
    selection.subscribe(() => seen.push(selection.current));

    selection.set('gitlab');

    expect(seen).toEqual(['gitlab']);
    expect(selection.current).toBe('gitlab');
  });

  it('does not notify when setting the already-active source', () => {
    const selection = new DataSourceSelection('github');
    let calls = 0;
    selection.subscribe(() => {
      calls += 1;
    });

    selection.set('github');

    expect(calls).toBe(0);
  });

  it('stops notifying after unsubscribe', () => {
    const selection = new DataSourceSelection('github');
    let calls = 0;
    const unsubscribe = selection.subscribe(() => {
      calls += 1;
    });

    unsubscribe();
    selection.set('gitlab');

    expect(calls).toBe(0);
  });
});
```

Note: pure closures and arrays, no `jest.fn()` — domain tests forbid mocks (rules §8).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/domain/shared/__tests__/DataSourceSelection.test.ts`
Expected: FAIL — cannot find module `../DataSource`.

- [ ] **Step 3: Implement the three domain files**

```ts
// src/domain/shared/DataSource.ts
export const DATA_SOURCE_IDS = ['github', 'gitlab'] as const;

export type DataSourceId = (typeof DATA_SOURCE_IDS)[number];

export function isDataSourceId(value: unknown): value is DataSourceId {
  return (DATA_SOURCE_IDS as readonly unknown[]).includes(value);
}
```

```ts
// src/domain/shared/DataSourceSelection.ts
import type { DataSourceId } from './DataSource';

export class DataSourceSelection {
  private active: DataSourceId;
  private readonly listeners = new Set<() => void>();

  constructor(initial: DataSourceId) {
    this.active = initial;
  }

  get current(): DataSourceId {
    return this.active;
  }

  set(next: DataSourceId): void {
    if (next === this.active) return;
    this.active = next;
    this.listeners.forEach((listener) => listener());
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}
```

```ts
// src/domain/shared/DataSourcePreferenceStorage.ts
import type { DataSourceId } from './DataSource';

export interface DataSourcePreferenceStorage {
  load(): Promise<DataSourceId | null>;
  save(source: DataSourceId): Promise<void>;
}
```

- [ ] **Step 4: Run the test and the full gates**

Run: `npx jest src/domain/shared` then `npm run type-check && npm run lint && npm test`
Expected: all PASS (109 existing + 8 new).

- [ ] **Step 5: Commit**

```bash
git add src/domain/shared
git commit -m "feat(domain): add data-source id, selection, and preference-storage contracts"
```

---

### Task 2: Entity field parity and uniform UI degradation

**Files:**
- Modify: `src/domain/entities/Owner.ts` (avatarUrl nullable)
- Modify: `src/domain/entities/Repository.ts` (RepositoryDetails nullable stats)
- Modify: `src/domain/entities/Issue.ts` (IssueLabel.color nullable)
- Modify: `src/presentation/issues/utils/labelColorToTone.ts`
- Modify: `src/presentation/repositories/components/RepositoryCard.tsx:88` (avatar uri)
- Modify: `src/presentation/repositories/components/RepositoryDetailContent.tsx` (avatar uri, watchers conditional)
- Modify: `src/presentation/issues/components/IssueCard.tsx:52` (avatar uri)
- Test: `src/presentation/issues/utils/__tests__/labelColorToTone.test.ts` (new)
- Test: `src/presentation/repositories/screens/__tests__/RepositoryDetailScreen.test.tsx` (add one case)

**Interfaces:**
- Consumes: nothing new.
- Produces (the contract every mapper and screen relies on from here):
  - `Owner.avatarUrl: string | null` (was `string`).
  - `RepositoryDetails.watchersCount / subscribersCount / networkCount / size: number | null` (were `number`); `defaultBranch: string | null` (was `string`). `license` stays `{ key: string; name: string; spdxId: string } | null`.
  - `IssueLabel.color: string | null` (was `string`); `id`/`name`/`description` unchanged.
  - `labelColorToTone(hex: string | null): BadgeTone` — `null` → `'default'`.

Per-field decision record (spec hard problem 5, decided against the actual UI usage read from the screens):
| Domain field | UI usage | GitHub | GitLab | Decision |
| --- | --- | --- | --- | --- |
| `name` | card title, route segment | `name` | `path` (URL-safe slug) | keep `string` |
| `fullName` | not rendered | `full_name` | `path_with_namespace` | keep `string` |
| `owner.login` | card/detail label, route segment | `owner.login` | `namespace.full_path` | keep `string` |
| `owner.avatarUrl` | `Avatar` (has initials fallback for `undefined`) | always present | may be `null`/relative | **nullable**, mapper normalizes relative URLs |
| `language` | conditional badge/stat (already) | present | no equivalent without extra request | GitLab maps `null`; UI already conditional |
| `topics` | not rendered (suggestions are static) | `topics` | `topics` | keep `string[]`, GitLab `?? []` |
| `starsCount`/`forksCount`/`openIssuesCount` | stats | direct | `star_count`/`forks_count`/`open_issues_count ?? 0` | keep `number` |
| `watchersCount` | "Watchers" stat | `watchers_count` | no equivalent | **nullable**; stat rendered conditionally |
| `subscribersCount`/`networkCount`/`size` | not rendered | present | no equivalent | **nullable** (honest domain, zero UI impact) |
| `defaultBranch` | not rendered | always present | `null` on empty projects | **nullable** |
| `license` | not rendered | object | needs extra param; skip | GitLab maps `null` (already nullable) |
| `isPrivate` | not rendered | `private` | `visibility !== 'public'` | keep `boolean` |
| `Issue.number` | "#n" in card | `number` | `iid` | keep `number` |
| `IssueLabel` | badges | objects with color | plain strings | **color nullable**; GitLab synthesizes `{ id: index, name, color: null, description: null }` |
| `Issue.author` | avatar + login | `user` | `author` (`username`, no `type`) | map `type: 'user'` |
| `Issue.isPullRequest` | filtered by use case | `pull_request` present | never (MRs are a separate endpoint) | GitLab maps `false` |

GitHub's mappers keep compiling untouched: `string` is assignable to `string | null`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/presentation/issues/utils/__tests__/labelColorToTone.test.ts
import { labelColorToTone } from '../labelColorToTone';

describe('labelColorToTone', () => {
  it('returns default when the label has no color', () => {
    expect(labelColorToTone(null)).toBe('default');
  });

  it('maps a red hex to danger', () => {
    expect(labelColorToTone('ee0701')).toBe('danger');
  });

  it('maps a neutral hex to default', () => {
    expect(labelColorToTone('cccccc')).toBe('default');
  });
});
```

Append to `describe('RepositoryDetailScreen', …)` in `src/presentation/repositories/screens/__tests__/RepositoryDetailScreen.test.tsx`:

```tsx
  it('omits the watchers stat when the source does not provide it', () => {
    withData({ data: makeDetail({ watchersCount: null }) });
    renderWithProviders(<RepositoryDetailScreen />);
    expect(screen.queryByText('Watchers')).toBeNull();
  });
```

(If `RepositoryStatItem` renders the label under a different text node, assert on whatever the "Watchers" label renders as — read `RepositoryStatItem.tsx` first; the existing positive case `renders repository header and stats` is the reference.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest labelColorToTone RepositoryDetailScreen`
Expected: `labelColorToTone(null)` fails on type/behavior; `watchersCount: null` fails type-check (`number` expected). The screen test failure may surface as a TS error — that is the expected failure mode here.

- [ ] **Step 3: Implement the entity and UI changes**

`src/domain/entities/Owner.ts` — change one line:

```ts
export interface Owner {
  id: number;
  login: string;
  avatarUrl: string | null;
  profileUrl: string;
  type: 'user' | 'organization';
}
```

`src/domain/entities/Repository.ts` — `Repository` unchanged; `RepositoryDetails` becomes:

```ts
export interface RepositoryDetails extends Repository {
  watchersCount: number | null;
  subscribersCount: number | null;
  networkCount: number | null;
  size: number | null;
  defaultBranch: string | null;
  license: { key: string; name: string; spdxId: string } | null;
  pushedAt: Date;
}
```

`src/domain/entities/Issue.ts` — `IssueLabel` becomes:

```ts
export interface IssueLabel {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
}
```

`src/presentation/issues/utils/labelColorToTone.ts`:

```ts
import type { BadgeTone } from '@/design-system';

export function labelColorToTone(hex: string | null): BadgeTone {
  if (hex === null) return 'default';

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  if (r > 180 && g < 100 && b < 100) return 'danger';
  if (g > 160 && r < 140) return 'success';
  if (r > 180 && g > 120 && b < 80) return 'warning';
  if (b > 160 && r < 140) return 'info';

  return 'default';
}
```

Avatar call sites (the design-system `Avatar` takes `uri?: string` and shows initials when `undefined`):
- `RepositoryCard.tsx`: `uri={repo.owner.avatarUrl ?? undefined}`
- `RepositoryDetailContent.tsx`: `uri={repository.owner.avatarUrl ?? undefined}`
- `IssueCard.tsx`: `uri={issue.author.avatarUrl ?? undefined}`

`RepositoryDetailContent.tsx` — wrap the Watchers stat exactly like the existing `language` conditional:

```tsx
              {repository.watchersCount !== null && (
                <RepositoryStatItem
                  icon="eye-outline"
                  value={formatCount(repository.watchersCount)}
                  label="Watchers"
                  iconColor={colors.info}
                />
              )}
```

- [ ] **Step 4: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS. Existing test fixtures pass concrete values for the now-nullable fields — no fixture edits needed.

- [ ] **Step 5: Commit**

```bash
git add src/domain/entities src/presentation
git commit -m "feat(domain): make source-specific entity fields explicitly nullable with uniform UI degradation"
```

---

### Task 3: Align page size with the spec (per_page=20)

**Files:**
- Modify: `src/infrastructure/github/constants.ts`
- Test (update): `src/infrastructure/github/__tests__/AxiosGitHubRepositoryDataSource.test.ts`
- Test (update): `src/infrastructure/github/__tests__/AxiosGitHubIssueDataSource.test.ts`
- Test (update): `src/infrastructure/github/__tests__/repositories.test.ts`

**Interfaces:**
- Produces: `GITHUB_PAGE_SIZE = 20`. Derived boundary: last searchable page = `1000 / 20 = 50` (the `Math.ceil` in `GitHubRepositoryRepository` needs no code change).

**Explicit decision:** the spec (§5) mandates `per_page=20` for both providers; the current code uses 30. We comply with the spec: 20 everywhere. Both providers keep their **own** constant (`GITHUB_PAGE_SIZE`, later `GITLAB_PAGE_SIZE`) rather than one shared constant — page size is a per-provider request particularity that may legitimately diverge, and cross-provider constant sharing is the "adapter importing another adapter's constant" anti-pattern (§9). The ADR in Task 13 records this.

- [ ] **Step 1: Update the tests to expect 20 (failing against current code)**

In `AxiosGitHubRepositoryDataSource.test.ts` and `AxiosGitHubIssueDataSource.test.ts`: change both `per_page: 30` expectations to `per_page: 20`.

In `repositories.test.ts`:
- `maps a full middle search page and advances pagination`: `total_count: 31` → `total_count: 21`; `Array.from({ length: 30 }, …)` → `Array.from({ length: 20 }, …)`; expectation `{ total: 21, nextPage: 2 }`.
- `stops at the last page supported by the GitHub search result window`: items array length 30 → 20; `.search('react', 34)` → `.search('react', 50)` (page 50 loads results 981–1000; `nextPage` must be `null`).
- `stops when the search response contains a partial page`: unchanged (10 < 20 still partial).
- `uses the raw datasource page size to determine the next page` (issues): array length 30 → 20; expectation `nextPage` stays `4`.

- [ ] **Step 2: Run to verify the updated tests fail**

Run: `npx jest src/infrastructure/github`
Expected: FAIL — expectations of 20 against constant 30.

- [ ] **Step 3: Change the constant**

```ts
// src/infrastructure/github/constants.ts
export const GITHUB_PAGE_SIZE = 20;
```

- [ ] **Step 4: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/github
git commit -m "fix(github): use spec-mandated per_page=20 for search and issues"
```

---

### Task 4: GitLab client, constants, and DTOs

**Files:**
- Create: `src/infrastructure/gitlab/client.ts`
- Create: `src/infrastructure/gitlab/constants.ts`
- Create: `src/infrastructure/gitlab/dtos.ts`
- Test: `src/infrastructure/gitlab/__tests__/client.test.ts`

**Interfaces:**
- Consumes: `DataAccessError`, `DataAccessErrorKind` from `@/domain/errors/DataAccessError`.
- Produces: `apiClient` (axios instance, base `https://gitlab.com/api/v4`); `toDataAccessError(error: AxiosError): DataAccessError`; `GITLAB_PAGE_SIZE = 20`; `GITLAB_WEB_BASE_URL = 'https://gitlab.com'`; DTO types `GitLabNamespaceDto`, `GitLabProjectDto`, `GitLabProjectDetailsDto`, `GitLabIssueAuthorDto`, `GitLabIssueDto`, `GitLabPageDto<T>`.

Error-mapping decision (§11: each provider translates its own errors): GitLab signals rate limiting with **429 only** — `403` on GitLab means forbidden, not rate limit, so unlike the GitHub client it maps to `unknown`. GitLab error bodies carry `message` or `error` (string); prefer `message`, then `error`, then the axios message.

- [ ] **Step 1: Write the failing test**

```ts
// src/infrastructure/gitlab/__tests__/client.test.ts
import type { AxiosError } from 'axios';

import { DataAccessError } from '@/domain/errors/DataAccessError';

import { toDataAccessError } from '../client';

function axiosErrorWith(status: number | undefined, data?: unknown): AxiosError {
  return {
    message: 'Request failed',
    response: status === undefined ? undefined : { status, data },
  } as AxiosError;
}

describe('toDataAccessError (GitLab)', () => {
  it('returns a DataAccessError', () => {
    expect(toDataAccessError(axiosErrorWith(500))).toBeInstanceOf(DataAccessError);
  });

  it.each([
    [429, 'rateLimit'],
    [404, 'notFound'],
    [403, 'unknown'],
    [500, 'unknown'],
  ])('maps status %i to kind %s', (status, kind) => {
    expect(toDataAccessError(axiosErrorWith(status)).kind).toBe(kind);
  });

  it('maps a missing response to the network kind', () => {
    expect(toDataAccessError(axiosErrorWith(undefined)).kind).toBe('network');
  });

  it('prefers the GitLab message over the axios message', () => {
    expect(toDataAccessError(axiosErrorWith(429, { message: 'Too many requests' })).message).toBe(
      'Too many requests',
    );
  });

  it('falls back to the error field when message is missing', () => {
    expect(toDataAccessError(axiosErrorWith(400, { error: 'bad request' })).message).toBe(
      'bad request',
    );
  });

  it('falls back to the axios message when the payload has none', () => {
    expect(toDataAccessError(axiosErrorWith(500, {})).message).toBe('Request failed');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/infrastructure/gitlab`
Expected: FAIL — module `../client` not found.

- [ ] **Step 3: Implement client, constants, DTOs**

```ts
// src/infrastructure/gitlab/constants.ts
export const GITLAB_PAGE_SIZE = 20;
export const GITLAB_WEB_BASE_URL = 'https://gitlab.com';
```

```ts
// src/infrastructure/gitlab/client.ts
import axios, { type AxiosError } from 'axios';

import { DataAccessError, type DataAccessErrorKind } from '@/domain/errors/DataAccessError';

import { GITLAB_WEB_BASE_URL } from './constants';

function toKind(status: number): DataAccessErrorKind {
  if (status === 429) return 'rateLimit';
  if (status === 404) return 'notFound';
  if (status === 0) return 'network';
  return 'unknown';
}

export function toDataAccessError(error: AxiosError): DataAccessError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as Record<string, unknown> | undefined;
  const rawMessage = data?.['message'] ?? data?.['error'];
  const message = typeof rawMessage === 'string' ? rawMessage : error.message;

  return new DataAccessError(toKind(status), message);
}

export const apiClient = axios.create({
  baseURL: `${GITLAB_WEB_BASE_URL}/api/v4`,
});

const token = process.env.EXPO_PUBLIC_GITLAB_TOKEN;

apiClient.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(toDataAccessError(error)),
);
```

```ts
// src/infrastructure/gitlab/dtos.ts
export interface GitLabNamespaceDto {
  id: number;
  name: string;
  path: string;
  kind: 'user' | 'group';
  full_path: string;
  avatar_url: string | null;
  web_url: string;
}

export interface GitLabProjectDto {
  id: number;
  name: string;
  path: string;
  path_with_namespace: string;
  description: string | null;
  web_url: string;
  avatar_url: string | null;
  star_count: number;
  forks_count: number;
  open_issues_count?: number;
  topics?: string[];
  last_activity_at: string;
  created_at: string;
  visibility?: 'public' | 'internal' | 'private';
  default_branch: string | null;
  namespace: GitLabNamespaceDto;
}

export type GitLabProjectDetailsDto = GitLabProjectDto;

export interface GitLabIssueAuthorDto {
  id: number;
  username: string;
  name: string;
  avatar_url: string | null;
  web_url: string;
}

export interface GitLabIssueDto {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  state: 'opened' | 'closed';
  author: GitLabIssueAuthorDto;
  labels: string[];
  user_notes_count: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  web_url: string;
}

/**
 * GitLab paginates via response headers (x-total, x-next-page). The datasource
 * hands them over verbatim (string or null when absent/empty); the repository
 * adapter parses them. `total` may be absent for expensive queries.
 */
export interface GitLabPageDto<T> {
  items: T[];
  totalHeader: string | null;
  nextPageHeader: string | null;
}
```

- [ ] **Step 4: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/gitlab
git commit -m "feat(gitlab): add axios client with domain error translation, constants, and DTOs"
```

---

### Task 5: GitLab datasource ports and Axios implementations

**Files:**
- Create: `src/infrastructure/gitlab/GitLabRepositoryDataSource.ts`
- Create: `src/infrastructure/gitlab/GitLabIssueDataSource.ts`
- Create: `src/infrastructure/gitlab/pageHeaders.ts`
- Create: `src/infrastructure/gitlab/AxiosGitLabRepositoryDataSource.ts`
- Create: `src/infrastructure/gitlab/AxiosGitLabIssueDataSource.ts`
- Test: `src/infrastructure/gitlab/__tests__/AxiosGitLabRepositoryDataSource.test.ts`
- Test: `src/infrastructure/gitlab/__tests__/AxiosGitLabIssueDataSource.test.ts`

**Interfaces:**
- Consumes: Task 4's `apiClient`, DTOs, `GITLAB_PAGE_SIZE`.
- Produces:
  - `interface GitLabRepositoryDataSource { searchProjects(query: string, page: number): Promise<GitLabPageDto<GitLabProjectDto>>; getProject(fullPath: string): Promise<GitLabProjectDetailsDto> }`
  - `interface GitLabIssueDataSource { listOpenIssues(fullPath: string, page: number): Promise<GitLabPageDto<GitLabIssueDto>> }`
  - `toPageDto<T>(items: T[], headers: Record<string, unknown>): GitLabPageDto<T>`
  - Classes `AxiosGitLabRepositoryDataSource`, `AxiosGitLabIssueDataSource` implementing the ports.

Two separate ports — never one shared datasource interface per repository (§9). `fullPath` is the plain `owner/name` string; **the datasource does the URL-encoding** because URL construction is its job (§6). Header extraction is verbatim string passing, not page math, so it belongs here; parsing to numbers happens in the repository adapters (Task 6).

- [ ] **Step 1: Write the failing tests** (`jest.mock('../client')` is legitimate here — the axios usage is the target, §8)

```ts
// src/infrastructure/gitlab/__tests__/AxiosGitLabRepositoryDataSource.test.ts
import { apiClient } from '../client';
import type { GitLabProjectDetailsDto } from '../dtos';
import { AxiosGitLabRepositoryDataSource } from '../AxiosGitLabRepositoryDataSource';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('AxiosGitLabRepositoryDataSource', () => {
  it('requests a project search with the expected path, params, and page headers', async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      headers: { 'x-total': '55', 'x-next-page': '3' },
    });

    const result = await new AxiosGitLabRepositoryDataSource().searchProjects('react', 2);

    expect(mockGet).toHaveBeenCalledWith('/projects', {
      params: { search: 'react', order_by: 'star_count', sort: 'desc', page: 2, per_page: 20 },
    });
    expect(result).toEqual({ items: [], totalHeader: '55', nextPageHeader: '3' });
  });

  it('returns null headers when GitLab omits or empties them', async () => {
    mockGet.mockResolvedValueOnce({ data: [], headers: { 'x-next-page': '' } });

    const result = await new AxiosGitLabRepositoryDataSource().searchProjects('react', 9);

    expect(result).toEqual({ items: [], totalHeader: null, nextPageHeader: null });
  });

  it('requests project details by URL-encoded full path', async () => {
    const response = { id: 1 } as GitLabProjectDetailsDto;
    mockGet.mockResolvedValueOnce({ data: response, headers: {} });

    const result = await new AxiosGitLabRepositoryDataSource().getProject('gitlab-org/gitlab-foss');

    expect(mockGet).toHaveBeenCalledWith('/projects/gitlab-org%2Fgitlab-foss');
    expect(result).toBe(response);
  });
});
```

```ts
// src/infrastructure/gitlab/__tests__/AxiosGitLabIssueDataSource.test.ts
import { apiClient } from '../client';
import { AxiosGitLabIssueDataSource } from '../AxiosGitLabIssueDataSource';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('AxiosGitLabIssueDataSource', () => {
  it('requests opened issues by URL-encoded full path with page headers', async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      headers: { 'x-total': '12', 'x-next-page': '4' },
    });

    const result = await new AxiosGitLabIssueDataSource().listOpenIssues(
      'gitlab-org/gitlab-foss',
      3,
    );

    expect(mockGet).toHaveBeenCalledWith('/projects/gitlab-org%2Fgitlab-foss/issues', {
      params: { state: 'opened', page: 3, per_page: 20 },
    });
    expect(result).toEqual({ items: [], totalHeader: '12', nextPageHeader: '4' });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/infrastructure/gitlab/__tests__/AxiosGitLab`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement ports, header helper, and Axios classes**

```ts
// src/infrastructure/gitlab/GitLabRepositoryDataSource.ts
import type { GitLabPageDto, GitLabProjectDetailsDto, GitLabProjectDto } from './dtos';

export interface GitLabRepositoryDataSource {
  searchProjects(query: string, page: number): Promise<GitLabPageDto<GitLabProjectDto>>;
  getProject(fullPath: string): Promise<GitLabProjectDetailsDto>;
}
```

```ts
// src/infrastructure/gitlab/GitLabIssueDataSource.ts
import type { GitLabIssueDto, GitLabPageDto } from './dtos';

export interface GitLabIssueDataSource {
  listOpenIssues(fullPath: string, page: number): Promise<GitLabPageDto<GitLabIssueDto>>;
}
```

```ts
// src/infrastructure/gitlab/pageHeaders.ts
import type { GitLabPageDto } from './dtos';

function readHeader(headers: Record<string, unknown>, name: string): string | null {
  const value = headers[name];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function toPageDto<T>(items: T[], headers: Record<string, unknown>): GitLabPageDto<T> {
  return {
    items,
    totalHeader: readHeader(headers, 'x-total'),
    nextPageHeader: readHeader(headers, 'x-next-page'),
  };
}
```

```ts
// src/infrastructure/gitlab/AxiosGitLabRepositoryDataSource.ts
import { apiClient } from './client';
import { GITLAB_PAGE_SIZE } from './constants';
import type { GitLabProjectDetailsDto, GitLabProjectDto } from './dtos';
import type { GitLabRepositoryDataSource } from './GitLabRepositoryDataSource';
import { toPageDto } from './pageHeaders';

export class AxiosGitLabRepositoryDataSource implements GitLabRepositoryDataSource {
  async searchProjects(query: string, page: number) {
    const response = await apiClient.get<GitLabProjectDto[]>('/projects', {
      params: {
        search: query,
        order_by: 'star_count',
        sort: 'desc',
        page,
        per_page: GITLAB_PAGE_SIZE,
      },
    });
    return toPageDto(response.data, response.headers as Record<string, unknown>);
  }

  async getProject(fullPath: string) {
    const { data } = await apiClient.get<GitLabProjectDetailsDto>(
      `/projects/${encodeURIComponent(fullPath)}`,
    );
    return data;
  }
}
```

```ts
// src/infrastructure/gitlab/AxiosGitLabIssueDataSource.ts
import { apiClient } from './client';
import { GITLAB_PAGE_SIZE } from './constants';
import type { GitLabIssueDto } from './dtos';
import type { GitLabIssueDataSource } from './GitLabIssueDataSource';
import { toPageDto } from './pageHeaders';

export class AxiosGitLabIssueDataSource implements GitLabIssueDataSource {
  async listOpenIssues(fullPath: string, page: number) {
    const response = await apiClient.get<GitLabIssueDto[]>(
      `/projects/${encodeURIComponent(fullPath)}/issues`,
      { params: { state: 'opened', page, per_page: GITLAB_PAGE_SIZE } },
    );
    return toPageDto(response.data, response.headers as Record<string, unknown>);
  }
}
```

- [ ] **Step 4: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/gitlab
git commit -m "feat(gitlab): add datasource ports and axios implementations with header-based paging"
```

---

### Task 6: GitLab mappers and domain-port repository adapters

**Files:**
- Create: `src/infrastructure/gitlab/mappers.ts`
- Create: `src/infrastructure/gitlab/GitLabRepositoryRepository.ts`
- Create: `src/infrastructure/gitlab/GitLabIssueRepository.ts`
- Test: `src/infrastructure/gitlab/__tests__/repositories.test.ts`

**Interfaces:**
- Consumes: Task 5 ports/DTOs; domain entities as reshaped by Task 2.
- Produces: `mapProject(dto): Repository`, `mapProjectDetails(dto): RepositoryDetails`, `mapIssue(dto): Issue`, `parsePositiveIntHeader(value: string | null): number | null`; `class GitLabRepositoryRepository implements RepositoryRepository`, `class GitLabIssueRepository implements IssueRepository` (constructor-injected datasources, exactly like the GitHub adapters).

This is where GitLab vocabulary dies (§5 of the checklist): `iid`→`number`, `opened`→`open`, `user_notes_count`→`commentsCount`, string labels → `IssueLabel` with `color: null`, namespace → `Owner`, relative avatar paths → absolute URLs, `x-total`/`x-next-page` header strings → `Page<T>.total`/`nextPage`.

- [ ] **Step 1: Write the failing tests** (datasource **fakes** — object literals; no `jest.mock`, per §8)

```ts
// src/infrastructure/gitlab/__tests__/repositories.test.ts
import type { GitLabIssueDto, GitLabProjectDetailsDto } from '../dtos';
import type { GitLabIssueDataSource } from '../GitLabIssueDataSource';
import { GitLabIssueRepository } from '../GitLabIssueRepository';
import type { GitLabRepositoryDataSource } from '../GitLabRepositoryDataSource';
import { GitLabRepositoryRepository } from '../GitLabRepositoryRepository';

function fakeRepositoryDataSource(
  overrides: Partial<GitLabRepositoryDataSource> = {},
): GitLabRepositoryDataSource {
  return { searchProjects: jest.fn(), getProject: jest.fn(), ...overrides };
}

function fakeIssueDataSource(
  overrides: Partial<GitLabIssueDataSource> = {},
): GitLabIssueDataSource {
  return { listOpenIssues: jest.fn(), ...overrides };
}

const mockProject: GitLabProjectDetailsDto = {
  id: 42,
  name: 'GitLab FOSS',
  path: 'gitlab-foss',
  path_with_namespace: 'gitlab-org/gitlab-foss',
  description: 'GitLab Community Edition',
  web_url: 'https://gitlab.com/gitlab-org/gitlab-foss',
  avatar_url: null,
  star_count: 2600,
  forks_count: 1100,
  open_issues_count: 300,
  topics: ['git', 'devops'],
  last_activity_at: '2024-02-01T00:00:00Z',
  created_at: '2011-10-09T00:00:00Z',
  visibility: 'public',
  default_branch: 'master',
  namespace: {
    id: 9970,
    name: 'GitLab.org',
    path: 'gitlab-org',
    kind: 'group',
    full_path: 'gitlab-org',
    avatar_url: '/uploads/-/system/group/avatar/9970/logo.png',
    web_url: 'https://gitlab.com/groups/gitlab-org',
  },
};

const mockIssue: GitLabIssueDto = {
  id: 501,
  iid: 7,
  title: 'Pipeline fails on retry',
  description: 'Details of the failure',
  state: 'opened',
  author: {
    id: 3,
    username: 'jane',
    name: 'Jane Doe',
    avatar_url: 'https://gitlab.com/uploads/user/avatar/3/avatar.png',
    web_url: 'https://gitlab.com/jane',
  },
  labels: ['bug', 'ci'],
  user_notes_count: 4,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  closed_at: null,
  web_url: 'https://gitlab.com/gitlab-org/gitlab-foss/-/issues/7',
};

describe('GitLabRepositoryRepository', () => {
  it('maps projects to source-agnostic entities and reads pagination from headers', async () => {
    const dataSource = fakeRepositoryDataSource({
      searchProjects: jest.fn().mockResolvedValue({
        items: [mockProject],
        totalHeader: '55',
        nextPageHeader: '3',
      }),
    });

    const result = await new GitLabRepositoryRepository(dataSource).search('gitlab', 2);

    expect(dataSource.searchProjects).toHaveBeenCalledWith('gitlab', 2);
    expect(result.total).toBe(55);
    expect(result.nextPage).toBe(3);
    expect(result.items[0]).toMatchObject({
      id: 42,
      name: 'gitlab-foss',
      fullName: 'gitlab-org/gitlab-foss',
      language: null,
      isPrivate: false,
      topics: ['git', 'devops'],
      owner: {
        login: 'gitlab-org',
        type: 'organization',
        avatarUrl: 'https://gitlab.com/uploads/-/system/group/avatar/9970/logo.png',
        profileUrl: 'https://gitlab.com/groups/gitlab-org',
      },
    });
    expect(result.items[0]?.createdAt).toEqual(new Date('2011-10-09T00:00:00Z'));
  });

  it('ends pagination and total when GitLab omits the headers', async () => {
    const dataSource = fakeRepositoryDataSource({
      searchProjects: jest.fn().mockResolvedValue({
        items: [mockProject],
        totalHeader: null,
        nextPageHeader: null,
      }),
    });

    const result = await new GitLabRepositoryRepository(dataSource).search('gitlab', 1);

    expect(result.total).toBeNull();
    expect(result.nextPage).toBeNull();
  });

  it('loads details by full path and marks source-missing stats as null', async () => {
    const dataSource = fakeRepositoryDataSource({
      getProject: jest.fn().mockResolvedValue(mockProject),
    });

    const result = await new GitLabRepositoryRepository(dataSource).findByOwnerAndName(
      'gitlab-org',
      'gitlab-foss',
    );

    expect(dataSource.getProject).toHaveBeenCalledWith('gitlab-org/gitlab-foss');
    expect(result).toMatchObject({
      watchersCount: null,
      subscribersCount: null,
      networkCount: null,
      size: null,
      defaultBranch: 'master',
      license: null,
    });
    expect(result.pushedAt).toEqual(new Date('2024-02-01T00:00:00Z'));
  });
});

describe('GitLabIssueRepository', () => {
  it('maps GitLab issue vocabulary to the domain contract', async () => {
    const dataSource = fakeIssueDataSource({
      listOpenIssues: jest.fn().mockResolvedValue({
        items: [mockIssue],
        totalHeader: '12',
        nextPageHeader: '4',
      }),
    });

    const result = await new GitLabIssueRepository(dataSource).findOpenByRepository(
      'gitlab-org',
      'gitlab-foss',
      3,
    );

    expect(dataSource.listOpenIssues).toHaveBeenCalledWith('gitlab-org/gitlab-foss', 3);
    expect(result.total).toBe(12);
    expect(result.nextPage).toBe(4);
    expect(result.items[0]).toMatchObject({
      id: 501,
      number: 7,
      state: 'open',
      commentsCount: 4,
      isPullRequest: false,
      author: { login: 'jane', type: 'user' },
      labels: [
        { id: 0, name: 'bug', color: null, description: null },
        { id: 1, name: 'ci', color: null, description: null },
      ],
    });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/infrastructure/gitlab/__tests__/repositories.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement mappers and repository adapters**

```ts
// src/infrastructure/gitlab/mappers.ts
import type { Issue } from '@/domain/entities/Issue';
import type { Owner } from '@/domain/entities/Owner';
import type { Repository, RepositoryDetails } from '@/domain/entities/Repository';

import { GITLAB_WEB_BASE_URL } from './constants';
import type {
  GitLabIssueAuthorDto,
  GitLabIssueDto,
  GitLabNamespaceDto,
  GitLabProjectDetailsDto,
  GitLabProjectDto,
} from './dtos';

function toAbsoluteUrl(url: string | null): string | null {
  if (url === null || url.length === 0) return null;
  return url.startsWith('http') ? url : `${GITLAB_WEB_BASE_URL}${url}`;
}

function mapNamespaceOwner(dto: GitLabNamespaceDto): Owner {
  return {
    id: dto.id,
    login: dto.full_path,
    avatarUrl: toAbsoluteUrl(dto.avatar_url),
    profileUrl: dto.web_url,
    type: dto.kind === 'user' ? 'user' : 'organization',
  };
}

function mapAuthorOwner(dto: GitLabIssueAuthorDto): Owner {
  return {
    id: dto.id,
    login: dto.username,
    avatarUrl: toAbsoluteUrl(dto.avatar_url),
    profileUrl: dto.web_url,
    type: 'user',
  };
}

export function mapProject(dto: GitLabProjectDto): Repository {
  return {
    id: dto.id,
    name: dto.path,
    fullName: dto.path_with_namespace,
    owner: mapNamespaceOwner(dto.namespace),
    description: dto.description,
    url: dto.web_url,
    language: null,
    starsCount: dto.star_count,
    forksCount: dto.forks_count,
    openIssuesCount: dto.open_issues_count ?? 0,
    topics: dto.topics ?? [],
    updatedAt: new Date(dto.last_activity_at),
    createdAt: new Date(dto.created_at),
    isPrivate: dto.visibility !== undefined && dto.visibility !== 'public',
  };
}

export function mapProjectDetails(dto: GitLabProjectDetailsDto): RepositoryDetails {
  return {
    ...mapProject(dto),
    watchersCount: null,
    subscribersCount: null,
    networkCount: null,
    size: null,
    defaultBranch: dto.default_branch,
    license: null,
    pushedAt: new Date(dto.last_activity_at),
  };
}

export function mapIssue(dto: GitLabIssueDto): Issue {
  return {
    id: dto.id,
    number: dto.iid,
    title: dto.title,
    body: dto.description,
    state: dto.state === 'closed' ? 'closed' : 'open',
    author: mapAuthorOwner(dto.author),
    labels: dto.labels.map((name, index) => ({
      id: index,
      name,
      color: null,
      description: null,
    })),
    commentsCount: dto.user_notes_count,
    createdAt: new Date(dto.created_at),
    updatedAt: new Date(dto.updated_at),
    closedAt: dto.closed_at ? new Date(dto.closed_at) : null,
    url: dto.web_url,
    isPullRequest: false,
  };
}

export function parsePositiveIntHeader(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
```

```ts
// src/infrastructure/gitlab/GitLabRepositoryRepository.ts
import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';

import type { GitLabRepositoryDataSource } from './GitLabRepositoryDataSource';
import { mapProject, mapProjectDetails, parsePositiveIntHeader } from './mappers';

export class GitLabRepositoryRepository implements RepositoryRepository {
  constructor(private readonly dataSource: GitLabRepositoryDataSource) {}

  async search(query: string, page = 1) {
    const data = await this.dataSource.searchProjects(query, page);

    return {
      items: data.items.map(mapProject),
      total: parsePositiveIntHeader(data.totalHeader),
      nextPage: parsePositiveIntHeader(data.nextPageHeader),
    };
  }

  async findByOwnerAndName(owner: string, name: string) {
    const data = await this.dataSource.getProject(`${owner}/${name}`);
    return mapProjectDetails(data);
  }
}
```

```ts
// src/infrastructure/gitlab/GitLabIssueRepository.ts
import type { IssueRepository } from '@/domain/repositories/IssueRepository';

import type { GitLabIssueDataSource } from './GitLabIssueDataSource';
import { mapIssue, parsePositiveIntHeader } from './mappers';

export class GitLabIssueRepository implements IssueRepository {
  constructor(private readonly dataSource: GitLabIssueDataSource) {}

  async findOpenByRepository(owner: string, repository: string, page = 1) {
    const data = await this.dataSource.listOpenIssues(`${owner}/${repository}`, page);

    return {
      items: data.items.map(mapIssue),
      total: parsePositiveIntHeader(data.totalHeader),
      nextPage: parsePositiveIntHeader(data.nextPageHeader),
    };
  }
}
```

Note: `total: 0` is impossible from `parsePositiveIntHeader` (a page with results has total ≥ 1; a missing header yields `null`), matching `Page<T>.total: number | null` semantics. Note also there is no PR filtering here — GitLab's `/issues` endpoint never returns merge requests, so `isPullRequest: false` and `ListRepoIssuesUseCase`'s filter is a harmless no-op: the business logic is byte-for-byte the same for both sources.

- [ ] **Step 4: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/gitlab
git commit -m "feat(gitlab): map projects and issues to domain entities with header-derived pagination"
```

---

### Task 7: Source-routed repository adapters (the single decision point)

**Files:**
- Create: `src/infrastructure/di/DataSourceRegistry.ts`
- Create: `src/infrastructure/di/SourceRoutedRepositoryRepository.ts`
- Create: `src/infrastructure/di/SourceRoutedIssueRepository.ts`
- Test: `src/infrastructure/di/__tests__/sourceRouting.test.ts`

**Interfaces:**
- Consumes: domain ports, `DataSourceId` (Task 1).
- Produces:
  - `interface DataSourceRegistryEntry { repositories: RepositoryRepository; issues: IssueRepository }`
  - `type DataSourceRegistry = Record<DataSourceId, DataSourceRegistryEntry>`
  - `class SourceRoutedRepositoryRepository implements RepositoryRepository` and `class SourceRoutedIssueRepository implements IssueRepository`, both with `constructor(registry: DataSourceRegistry, activeSource: () => DataSourceId)`.

`Record<DataSourceId, …>` makes the compiler enforce that adding `'bitbucket'` to `DATA_SOURCE_IDS` fails to build until the registry provides its stack — the switch stays a data lookup forever, never an `if/else` chain. These files define classes only; instantiation stays exclusive to `container.ts` (Task 8).

- [ ] **Step 1: Write the failing test** (fake domain repositories = object literals with `jest.fn` members, plus the **real** `DataSourceSelection` — no module mocks)

```ts
// src/infrastructure/di/__tests__/sourceRouting.test.ts
import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';

import type { DataSourceRegistry } from '../DataSourceRegistry';
import { SourceRoutedIssueRepository } from '../SourceRoutedIssueRepository';
import { SourceRoutedRepositoryRepository } from '../SourceRoutedRepositoryRepository';

const emptyPage = { items: [], total: null, nextPage: null };

function fakeRegistry(): DataSourceRegistry {
  const repositories = (): jest.Mocked<RepositoryRepository> => ({
    search: jest.fn().mockResolvedValue(emptyPage),
    findByOwnerAndName: jest.fn(),
  });
  const issues = (): jest.Mocked<IssueRepository> => ({
    findOpenByRepository: jest.fn().mockResolvedValue(emptyPage),
  });
  return {
    github: { repositories: repositories(), issues: issues() },
    gitlab: { repositories: repositories(), issues: issues() },
  };
}

describe('SourceRoutedRepositoryRepository', () => {
  it('delegates to the active source and follows a runtime switch per call', async () => {
    const registry = fakeRegistry();
    const selection = new DataSourceSelection('github');
    const routed = new SourceRoutedRepositoryRepository(registry, () => selection.current);

    await routed.search('react', 2);
    expect(registry.github.repositories.search).toHaveBeenCalledWith('react', 2);
    expect(registry.gitlab.repositories.search).not.toHaveBeenCalled();

    selection.set('gitlab');

    await routed.search('react', 1);
    await routed.findByOwnerAndName('gitlab-org', 'gitlab-foss');
    expect(registry.gitlab.repositories.search).toHaveBeenCalledWith('react', 1);
    expect(registry.gitlab.repositories.findByOwnerAndName).toHaveBeenCalledWith(
      'gitlab-org',
      'gitlab-foss',
    );
    expect(registry.github.repositories.search).toHaveBeenCalledTimes(1);
  });
});

describe('SourceRoutedIssueRepository', () => {
  it('delegates to the active source per call', async () => {
    const registry = fakeRegistry();
    const selection = new DataSourceSelection('gitlab');
    const routed = new SourceRoutedIssueRepository(registry, () => selection.current);

    await routed.findOpenByRepository('gitlab-org', 'gitlab-foss', 5);
    expect(registry.gitlab.issues.findOpenByRepository).toHaveBeenCalledWith(
      'gitlab-org',
      'gitlab-foss',
      5,
    );

    selection.set('github');

    await routed.findOpenByRepository('facebook', 'react', 1);
    expect(registry.github.issues.findOpenByRepository).toHaveBeenCalledWith(
      'facebook',
      'react',
      1,
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/infrastructure/di`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement registry type and routed classes**

```ts
// src/infrastructure/di/DataSourceRegistry.ts
import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';
import type { DataSourceId } from '@/domain/shared/DataSource';

export interface DataSourceRegistryEntry {
  repositories: RepositoryRepository;
  issues: IssueRepository;
}

export type DataSourceRegistry = Record<DataSourceId, DataSourceRegistryEntry>;
```

```ts
// src/infrastructure/di/SourceRoutedRepositoryRepository.ts
import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';
import type { DataSourceId } from '@/domain/shared/DataSource';

import type { DataSourceRegistry } from './DataSourceRegistry';

export class SourceRoutedRepositoryRepository implements RepositoryRepository {
  constructor(
    private readonly registry: DataSourceRegistry,
    private readonly activeSource: () => DataSourceId,
  ) {}

  search(query: string, page?: number) {
    return this.registry[this.activeSource()].repositories.search(query, page);
  }

  findByOwnerAndName(owner: string, name: string) {
    return this.registry[this.activeSource()].repositories.findByOwnerAndName(owner, name);
  }
}
```

```ts
// src/infrastructure/di/SourceRoutedIssueRepository.ts
import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { DataSourceId } from '@/domain/shared/DataSource';

import type { DataSourceRegistry } from './DataSourceRegistry';

export class SourceRoutedIssueRepository implements IssueRepository {
  constructor(
    private readonly registry: DataSourceRegistry,
    private readonly activeSource: () => DataSourceId,
  ) {}

  findOpenByRepository(owner: string, repository: string, page?: number) {
    return this.registry[this.activeSource()].issues.findOpenByRepository(owner, repository, page);
  }
}
```

- [ ] **Step 4: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/di
git commit -m "feat(infra): add source-routed repository adapters resolving the active source per call"
```

---

### Task 8: Composition root wiring and AsyncStorage persistence adapter

**Files:**
- Modify: `src/infrastructure/di/container.ts`
- Modify: `src/infrastructure/di/index.ts`
- Create: `src/infrastructure/storage/AsyncStorageDataSourcePreference.ts`
- Test: `src/infrastructure/storage/__tests__/AsyncStorageDataSourcePreference.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1, 6, 7.
- Produces: `dataSourceSelection: DataSourceSelection` exported from `@/infrastructure/di` (initial `'github'`); `repoService`/`issueService` unchanged in shape; `AsyncStorageDataSourcePreference` class and `asyncStorageDataSourcePreference` singleton (mirroring `asyncStorageThemePreference` — the user-mandated pattern; storage key `@github_explorer/data_source`).

- [ ] **Step 1: Write the failing storage test** (AsyncStorage is already module-mocked in `jest.setup.ts`; mirrors the theme-preference test)

```ts
// src/infrastructure/storage/__tests__/AsyncStorageDataSourcePreference.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AsyncStorageDataSourcePreference } from '../AsyncStorageDataSourcePreference';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => jest.clearAllMocks());

describe('AsyncStorageDataSourcePreference', () => {
  it('loads a persisted source using the dedicated storage key', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('gitlab');

    await expect(new AsyncStorageDataSourcePreference().load()).resolves.toBe('gitlab');
    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@github_explorer/data_source');
  });

  it('returns null for an unsupported stored value', async () => {
    mockAsyncStorage.getItem.mockResolvedValueOnce('bitbucket');

    await expect(new AsyncStorageDataSourcePreference().load()).resolves.toBeNull();
  });

  it('saves the source using the dedicated storage key', async () => {
    await new AsyncStorageDataSourcePreference().save('github');

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      '@github_explorer/data_source',
      'github',
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/infrastructure/storage`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement storage adapter and rewire the container**

```ts
// src/infrastructure/storage/AsyncStorageDataSourcePreference.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isDataSourceId, type DataSourceId } from '@/domain/shared/DataSource';
import type { DataSourcePreferenceStorage } from '@/domain/shared/DataSourcePreferenceStorage';

const STORAGE_KEY = '@github_explorer/data_source';

export class AsyncStorageDataSourcePreference implements DataSourcePreferenceStorage {
  async load(): Promise<DataSourceId | null> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return isDataSourceId(stored) ? stored : null;
  }

  async save(source: DataSourceId): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, source);
  }
}

export const asyncStorageDataSourcePreference = new AsyncStorageDataSourcePreference();
```

Replace `src/infrastructure/di/container.ts` with:

```ts
import { IssueService } from '@/application/issues/IssueService';
import { ListRepoIssuesUseCase } from '@/application/issues/ListRepoIssuesUseCase';
import { GetRepoDetailsUseCase } from '@/application/repositories/GetRepoDetailsUseCase';
import { RepoService } from '@/application/repositories/RepoService';
import { SearchReposUseCase } from '@/application/repositories/SearchReposUseCase';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import { AxiosGitHubIssueDataSource } from '@/infrastructure/github/AxiosGitHubIssueDataSource';
import { AxiosGitHubRepositoryDataSource } from '@/infrastructure/github/AxiosGitHubRepositoryDataSource';
import { GitHubIssueRepository } from '@/infrastructure/github/GitHubIssueRepository';
import { GitHubRepositoryRepository } from '@/infrastructure/github/GitHubRepositoryRepository';
import { AxiosGitLabIssueDataSource } from '@/infrastructure/gitlab/AxiosGitLabIssueDataSource';
import { AxiosGitLabRepositoryDataSource } from '@/infrastructure/gitlab/AxiosGitLabRepositoryDataSource';
import { GitLabIssueRepository } from '@/infrastructure/gitlab/GitLabIssueRepository';
import { GitLabRepositoryRepository } from '@/infrastructure/gitlab/GitLabRepositoryRepository';

import type { DataSourceRegistry } from './DataSourceRegistry';
import { SourceRoutedIssueRepository } from './SourceRoutedIssueRepository';
import { SourceRoutedRepositoryRepository } from './SourceRoutedRepositoryRepository';

export const dataSourceSelection = new DataSourceSelection('github');

const registry: DataSourceRegistry = {
  github: {
    repositories: new GitHubRepositoryRepository(new AxiosGitHubRepositoryDataSource()),
    issues: new GitHubIssueRepository(new AxiosGitHubIssueDataSource()),
  },
  gitlab: {
    repositories: new GitLabRepositoryRepository(new AxiosGitLabRepositoryDataSource()),
    issues: new GitLabIssueRepository(new AxiosGitLabIssueDataSource()),
  },
};

const repositoryRepository = new SourceRoutedRepositoryRepository(
  registry,
  () => dataSourceSelection.current,
);
const issueRepository = new SourceRoutedIssueRepository(
  registry,
  () => dataSourceSelection.current,
);

export const repoService = new RepoService(
  new SearchReposUseCase(repositoryRepository),
  new GetRepoDetailsUseCase(repositoryRepository),
);

export const issueService = new IssueService(new ListRepoIssuesUseCase(issueRepository));
```

Replace `src/infrastructure/di/index.ts` with:

```ts
export { dataSourceSelection, issueService, repoService } from './container';
```

- [ ] **Step 4: Run the full gates plus architecture greps**

Run: `npm run type-check && npm run lint && npm test`
Then:
```bash
grep -rn "^import" src/domain --include="*.ts" | grep -v "from '\./\|from '\.\./"   # must be empty
grep -rn "@/infrastructure" src/application                                          # must be empty
```
Expected: all PASS, greps empty.

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure
git commit -m "feat(infra): wire both provider stacks behind the source registry in the composition root"
```

---

### Task 9: DataSourceProvider, test-utils, and root layout

**Files:**
- Create: `src/presentation/di/DataSourceProvider.tsx`
- Test: `src/presentation/di/__tests__/DataSourceProvider.test.tsx`
- Modify: `src/presentation/__test-utils__/renderWithProviders.tsx`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Consumes: `DataSourceSelection`, `DataSourcePreferenceStorage`, `DataSourceId` (Task 1); `dataSourceSelection` and `asyncStorageDataSourcePreference` (Task 8 — infra imports are legal here: this file is under `presentation/di/`).
- Produces: `DataSourceProvider({ selection?, storage?, children })`; `useDataSource(): { source: DataSourceId; setSource(source: DataSourceId): void }`; `useDataSourceScope(): DataSourceId`. `renderWithProviders` gains an optional `dataSourceSelection?: DataSourceSelection` and always wraps a `DataSourceProvider` (fresh `new DataSourceSelection('github')` per render for isolation — a domain import, allowed anywhere).

The provider reads the **container's** selection via `useSyncExternalStore`, so there is exactly one source of truth shared by React and the routed adapters; `setSource` mutates it synchronously (queries fired after the key change already see the new source) and persists fire-and-forget, exactly like `ThemeProvider.toggleMode`.

- [ ] **Step 1: Write the failing test** (this file lives under `presentation/di/`, so infra imports would be legal, but plain fakes suffice)

```tsx
// src/presentation/di/__tests__/DataSourceProvider.test.tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';

import type { DataSourceId } from '@/domain/shared/DataSource';
import type { DataSourcePreferenceStorage } from '@/domain/shared/DataSourcePreferenceStorage';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';

import { DataSourceProvider, useDataSource } from '../DataSourceProvider';

function Probe() {
  const { source, setSource } = useDataSource();
  return (
    <Pressable testID="switch-to-gitlab" onPress={() => setSource('gitlab')}>
      <Text testID="current-source">{source}</Text>
    </Pressable>
  );
}

function fakeStorage(loadValue: DataSourceId | null = null) {
  const saved: DataSourceId[] = [];
  const storage: DataSourcePreferenceStorage = {
    load: async () => loadValue,
    save: async (source) => {
      saved.push(source);
    },
  };
  return { storage, saved };
}

describe('DataSourceProvider', () => {
  it('exposes the selection current source', () => {
    render(
      <DataSourceProvider selection={new DataSourceSelection('github')}>
        <Probe />
      </DataSourceProvider>,
    );

    expect(screen.getByTestId('current-source')).toHaveTextContent('github');
  });

  it('switches the shared selection and persists the choice', async () => {
    const selection = new DataSourceSelection('github');
    const { storage, saved } = fakeStorage();

    render(
      <DataSourceProvider selection={selection} storage={storage}>
        <Probe />
      </DataSourceProvider>,
    );

    fireEvent.press(screen.getByTestId('switch-to-gitlab'));

    expect(selection.current).toBe('gitlab');
    expect(screen.getByTestId('current-source')).toHaveTextContent('gitlab');
    await waitFor(() => expect(saved).toEqual(['gitlab']));
  });

  it('applies the persisted source after mount', async () => {
    const { storage } = fakeStorage('gitlab');

    render(
      <DataSourceProvider selection={new DataSourceSelection('github')} storage={storage}>
        <Probe />
      </DataSourceProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('current-source')).toHaveTextContent('gitlab'));
  });

  it('throws when useDataSource is used outside the provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow(
      'useDataSource must be used inside <DataSourceProvider>',
    );
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/presentation/di`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the provider, update test-utils and root layout**

```tsx
// src/presentation/di/DataSourceProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import type { DataSourceId } from '@/domain/shared/DataSource';
import type { DataSourcePreferenceStorage } from '@/domain/shared/DataSourcePreferenceStorage';
import type { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import { dataSourceSelection as defaultSelection } from '@/infrastructure/di';

export interface DataSourceContextValue {
  source: DataSourceId;
  setSource: (source: DataSourceId) => void;
}

const noOpStorage: DataSourcePreferenceStorage = {
  load: async () => null,
  save: async () => undefined,
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({
  selection = defaultSelection,
  storage = noOpStorage,
  children,
}: {
  selection?: DataSourceSelection;
  storage?: DataSourcePreferenceStorage;
  children: React.ReactNode;
}) {
  const source = useSyncExternalStore(selection.subscribe, () => selection.current);

  useEffect(() => {
    let cancelled = false;
    void storage.load().then((stored) => {
      if (!cancelled && stored !== null) selection.set(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [selection, storage]);

  const value = useMemo<DataSourceContextValue>(
    () => ({
      source,
      setSource: (next) => {
        selection.set(next);
        void storage.save(next);
      },
    }),
    [source, selection, storage],
  );

  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>;
}

export function useDataSource(): DataSourceContextValue {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used inside <DataSourceProvider>');
  }
  return context;
}

export const useDataSourceScope = (): DataSourceId => useDataSource().source;
```

Replace `src/presentation/__test-utils__/renderWithProviders.tsx` with:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import React from 'react';

import { ThemeProvider } from '@/design-system';
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import {
  ApplicationProvider,
  type ApplicationServices,
} from '@/presentation/di/ApplicationProvider';
import { DataSourceProvider } from '@/presentation/di/DataSourceProvider';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  services?: Partial<ApplicationServices>;
  dataSourceSelection?: DataSourceSelection;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { services, dataSourceSelection, ...options }: RenderWithProvidersOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  const selection = dataSourceSelection ?? new DataSourceSelection('github');

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DataSourceProvider selection={selection}>
        <ApplicationProvider services={services}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryClientProvider>
        </ApplicationProvider>
      </DataSourceProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
```

In `src/app/_layout.tsx`, add the imports and wrap the tree (only `RootLayout` changes):

```tsx
import { asyncStorageDataSourcePreference } from '@/infrastructure/storage/AsyncStorageDataSourcePreference';
import { DataSourceProvider } from '@/presentation/di/DataSourceProvider';
```

```tsx
export default function RootLayout() {
  return (
    <DataSourceProvider storage={asyncStorageDataSourcePreference}>
      <ApplicationProvider>
        <QueryProvider>
          <ThemeProvider storage={asyncStorageThemePreference}>
            <ThemedStack />
          </ThemeProvider>
        </QueryProvider>
      </ApplicationProvider>
    </DataSourceProvider>
  );
}
```

- [ ] **Step 4: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS — the `renderWithProviders` change is additive, every existing presentation test must still be green.

- [ ] **Step 5: Commit**

```bash
git add src/presentation src/app/_layout.tsx
git commit -m "feat(presentation): provide the active data source via context with persisted preference"
```

---

### Task 10: Source-scoped query keys

**Files:**
- Modify: `src/presentation/shared/queryKeys.ts`
- Modify: `src/presentation/repositories/hooks/useSearchRepos.ts`
- Modify: `src/presentation/repositories/hooks/useRepoDetails.ts`
- Modify: `src/presentation/issues/hooks/useRepoIssues.ts`

**Interfaces:**
- Consumes: `useDataSourceScope` (Task 9), `DataSourceId` (Task 1).
- Produces: `queryKeys.repositories.search(scope, query)`, `.detail(scope, owner, repo)`, `.issues(scope, owner, repo)`. Hooks keep their public signatures — screens change **nothing**.

This is the cache-isolation decision: the scope is an opaque namespace inside the key. Switching sources changes the key → TanStack Query starts a fresh query (loading skeletons appear via the exact same states screens already render) while the previous source's pages stay cached for instant switch-back. No invalidation, no remount, no `if`.

- [ ] **Step 1: Update the code** (compile-time-driven change; the behavioral test comes with the toggle in Task 12)

```ts
// src/presentation/shared/queryKeys.ts
import type { DataSourceId } from '@/domain/shared/DataSource';

export const queryKeys = {
  repositories: {
    search: (scope: DataSourceId, query: string) =>
      ['repositories', scope, 'search', query] as const,
    detail: (scope: DataSourceId, owner: string, repo: string) =>
      ['repositories', scope, 'detail', owner, repo] as const,
    issues: (scope: DataSourceId, owner: string, repo: string) =>
      ['repositories', scope, 'issues', owner, repo] as const,
  },
} as const;
```

```ts
// src/presentation/repositories/hooks/useSearchRepos.ts
import { useInfiniteQuery } from '@tanstack/react-query';

import { useRepoService } from '@/presentation/di/ApplicationProvider';
import { useDataSourceScope } from '@/presentation/di/DataSourceProvider';
import { queryKeys } from '@/presentation/shared/queryKeys';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function useSearchRepos(query: string) {
  const repositories = useRepoService();
  const scope = useDataSourceScope();

  return useInfiniteQuery({
    queryKey: queryKeys.repositories.search(scope, query),
    queryFn: ({ pageParam }) => repositories.search(query, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: query.trim().length > 0,
    staleTime: FIVE_MINUTES_MS,
  });
}
```

```ts
// src/presentation/repositories/hooks/useRepoDetails.ts
import { useQuery } from '@tanstack/react-query';

import { useRepoService } from '@/presentation/di/ApplicationProvider';
import { useDataSourceScope } from '@/presentation/di/DataSourceProvider';
import { queryKeys } from '@/presentation/shared/queryKeys';

export function useRepoDetails(owner: string, repo: string) {
  const repositories = useRepoService();
  const scope = useDataSourceScope();

  return useQuery({
    queryKey: queryKeys.repositories.detail(scope, owner, repo),
    queryFn: () => repositories.details(owner, repo),
    enabled: owner.length > 0 && repo.length > 0,
    staleTime: 60 * 1000,
  });
}
```

```ts
// src/presentation/issues/hooks/useRepoIssues.ts
import { useInfiniteQuery } from '@tanstack/react-query';

import { useIssueService } from '@/presentation/di/ApplicationProvider';
import { useDataSourceScope } from '@/presentation/di/DataSourceProvider';
import { queryKeys } from '@/presentation/shared/queryKeys';

export function useRepoIssues(owner: string, repo: string) {
  const issues = useIssueService();
  const scope = useDataSourceScope();

  return useInfiniteQuery({
    queryKey: queryKeys.repositories.issues(scope, owner, repo),
    queryFn: ({ pageParam }) => issues.listOpen(owner, repo, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: owner.length > 0 && repo.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS. The `SearchScreen.injection` test exercises the real `useSearchRepos` → it now requires `DataSourceProvider`, already present in `renderWithProviders` since Task 9.

- [ ] **Step 3: Commit**

```bash
git add src/presentation
git commit -m "feat(presentation): namespace query keys by active data source"
```

---

### Task 11: Source-neutral error state and navigation options

**Files:**
- Create: `src/presentation/shared/components/DataAccessErrorState.tsx`
- Create: `src/presentation/shared/navigation/getStackScreenOptions.ts`
- Delete: `src/presentation/github/components/GithubApiErrorState.tsx`
- Delete: `src/presentation/github/navigation/getGithubStackScreenOptions.ts` (remove the now-empty `src/presentation/github/` folder)
- Modify: `src/presentation/repositories/components/SearchContent.tsx` (import + generic message + placeholder)
- Modify: `src/presentation/repositories/screens/RepositoryDetailScreen.tsx` (imports)
- Modify: `src/presentation/issues/screens/IssuesScreen.tsx` (imports)
- Test (update): `src/presentation/repositories/screens/__tests__/SearchScreen.test.tsx`
- Test (update): `src/presentation/issues/screens/__tests__/IssuesScreen.test.tsx`
- Test (update): `src/presentation/repositories/screens/__tests__/RepositoryDetailScreen.test.tsx`

**Interfaces:**
- Produces: `DataAccessErrorState` with the **same props** as the old component (`isRateLimit: boolean; genericMessage: string; testID: string; onRetry?: () => void; retryTestID?: string`) and the same testIDs, so screens change only the import line and copy. `getStackScreenOptions({ title, colors })` — body identical to the old function, renamed.

Why: a component named "GithubApiErrorState" telling GitLab users to set a GitHub token is exactly the source leak the evaluator looks for. The rate-limit copy becomes source-neutral; the generic messages already are.

- [ ] **Step 1: Update the three test files (failing first)**

In `SearchScreen.test.tsx`, `IssuesScreen.test.tsx`, and `RepositoryDetailScreen.test.tsx`, replace every
`expect(screen.getByText(/EXPO_PUBLIC_GITHUB_TOKEN/)).toBeTruthy();`
with
`expect(screen.getByText(/token de acesso/)).toBeTruthy();`

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest SearchScreen IssuesScreen RepositoryDetailScreen`
Expected: FAIL — current copy still mentions the GitHub env var.

- [ ] **Step 3: Implement the neutral components and rewire imports**

```tsx
// src/presentation/shared/components/DataAccessErrorState.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Box, Button, Text, useTheme } from '@/design-system';

interface DataAccessErrorStateProps {
  isRateLimit: boolean;
  genericMessage: string;
  testID: string;
  onRetry?: () => void;
  retryTestID?: string;
}

export function DataAccessErrorState({
  isRateLimit,
  genericMessage,
  testID,
  onRetry,
  retryTestID,
}: DataAccessErrorStateProps) {
  const { colors } = useTheme();

  return (
    <Box flex={1} align="center" justify="center" padding="xl" testID={testID}>
      {isRateLimit ? (
        <Box direction="column" align="center" gap="sm">
          <Ionicons name="warning-outline" size={48} color={colors.warning} />
          <Text weight="bold" tone="danger">
            Limite de requisições da API atingido
          </Text>
          <Text tone="muted" size="sm">
            Aguarde alguns minutos ou configure um token de acesso no arquivo .env para aumentar o
            limite.
          </Text>
        </Box>
      ) : (
        <Box direction="column" align="center" gap="md">
          <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
          <Text tone="danger" weight="bold">
            Algo deu errado
          </Text>
          <Text tone="muted" size="sm">
            {genericMessage}
          </Text>
          {onRetry !== undefined && (
            <Button variant="outline" onPress={onRetry} testID={retryTestID}>
              Tentar novamente
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
```

```ts
// src/presentation/shared/navigation/getStackScreenOptions.ts
import { Platform } from 'react-native';

import type { Theme } from '@/design-system';

interface StackScreenOptionsParams {
  title: string | undefined;
  colors: Theme['colors'];
}

export function getStackScreenOptions({ title, colors }: StackScreenOptionsParams) {
  return {
    title,
    headerTransparent: Platform.OS === 'ios',
    headerBlurEffect: 'regular' as const,
    headerStyle: Platform.OS !== 'ios' ? { backgroundColor: colors.background } : undefined,
    headerTintColor: colors.text,
    headerBackTitle: '',
  };
}
```

Rewire callers (mechanical: same props, new names):
- `SearchContent.tsx`: import `DataAccessErrorState` from `@/presentation/shared/components/DataAccessErrorState`; replace the `<GithubApiErrorState …>` JSX tag with `<DataAccessErrorState …>` (props unchanged, testIDs `rate-limit-error`/`generic-error` unchanged); change the generic message to `"Não foi possível acessar a fonte de dados. Verifique sua conexão e tente novamente."`; change the input placeholder to `"Buscar repositórios…"`.
- `RepositoryDetailScreen.tsx`: swap both imports (`DataAccessErrorState`, `getStackScreenOptions`) and both call sites (`getGithubStackScreenOptions(` → `getStackScreenOptions(`, `<GithubApiErrorState` → `<DataAccessErrorState`).
- `IssuesScreen.tsx`: same two swaps.
- Delete `src/presentation/github/` entirely.

- [ ] **Step 4: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS; `grep -rn "presentation/github" src` returns nothing.

- [ ] **Step 5: Commit**

```bash
git add -A src/presentation
git commit -m "refactor(presentation): make error state and stack options source-neutral"
```

---

### Task 12: DataSourceToggle in the search header and source-agnostic routing

**Files:**
- Create: `src/presentation/shared/components/DataSourceToggle.tsx`
- Test: `src/presentation/shared/components/__tests__/DataSourceToggle.test.tsx`
- Modify: `src/presentation/repositories/screens/SearchScreen.tsx` (header row + encoded push)
- Modify: `src/presentation/repositories/screens/RepositoryDetailScreen.tsx` (encoded push)
- Test (update): `src/presentation/repositories/screens/__tests__/SearchScreen.injection.test.tsx`

**Interfaces:**
- Consumes: `useDataSource` (Task 9), `DATA_SOURCE_IDS`/`DataSourceId` (Task 1), design-system `Text`/`useTheme` (radius keys are `sm|md|lg`; spacing keys `xs|sm|md|lg|xl`).
- Produces: `DataSourceToggle` (no props), testIDs `data-source-toggle` and `data-source-option-github` / `data-source-option-gitlab`.

The label map (`github → 'GitHub'`) is display data, not control flow — iterating `DATA_SOURCE_IDS` means a future source appears in the toggle by editing the domain list and this map only. Route pushes gain `encodeURIComponent` on both segments: identical for GitHub logins, required for GitLab nested group paths (`group/subgroup`), and `useLocalSearchParams` hands the decoded value back to the detail/issues screens.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/presentation/shared/components/__tests__/DataSourceToggle.test.tsx
import { fireEvent, screen } from '@testing-library/react-native';
import React from 'react';

import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import { renderWithProviders } from '@/presentation/__test-utils__/renderWithProviders';

import { DataSourceToggle } from '../DataSourceToggle';

describe('DataSourceToggle', () => {
  it('renders one option per data source with the active one selected', () => {
    renderWithProviders(<DataSourceToggle />);

    expect(screen.getByText('GitHub')).toBeTruthy();
    expect(screen.getByText('GitLab')).toBeTruthy();
    expect(
      screen.getByTestId('data-source-option-github').props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByTestId('data-source-option-gitlab').props.accessibilityState.selected,
    ).toBe(false);
  });

  it('switches the shared selection when an option is pressed', () => {
    const selection = new DataSourceSelection('github');
    renderWithProviders(<DataSourceToggle />, { dataSourceSelection: selection });

    fireEvent.press(screen.getByTestId('data-source-option-gitlab'));

    expect(selection.current).toBe('gitlab');
    expect(
      screen.getByTestId('data-source-option-gitlab').props.accessibilityState.selected,
    ).toBe(true);
  });
});
```

In `SearchScreen.injection.test.tsx`, first replace the router mock so the push is observable:

```tsx
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Stack: { Screen: () => null },
}));
```

add `beforeEach(() => jest.clearAllMocks());`, then append two tests inside the describe:

```tsx
  it('refetches through the same injected service when the source switches', async () => {
    const search = jest.fn().mockResolvedValue({
      items: [injectedRepository],
      total: 1,
      nextPage: null,
    });
    const repositoryService = { search, details: jest.fn() } as unknown as RepoService;

    renderWithProviders(<SearchScreen />, {
      services: applicationServicesWithRepo(repositoryService),
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'injected');
    await waitFor(() => expect(screen.getByText('injected-repository')).toBeTruthy());

    fireEvent.press(screen.getByTestId('data-source-option-gitlab'));

    await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
  });

  it('URL-encodes route segments when opening a repository', async () => {
    const nested: Repository = {
      ...injectedRepository,
      owner: { ...injectedRepository.owner, login: 'group/subgroup' },
    };
    const search = jest.fn().mockResolvedValue({ items: [nested], total: 1, nextPage: null });
    const repositoryService = { search, details: jest.fn() } as unknown as RepoService;

    renderWithProviders(<SearchScreen />, {
      services: applicationServicesWithRepo(repositoryService),
    });
    fireEvent.changeText(screen.getByTestId('search-input'), 'injected');
    await waitFor(() => expect(screen.getByTestId(`repo-card-${nested.id}`)).toBeTruthy());

    fireEvent.press(screen.getByTestId(`repo-card-${nested.id}`));

    expect(mockPush).toHaveBeenCalledWith('/repository/group%2Fsubgroup/injected-repository');
  });
```

The first new test is the requirement's proof: **the same injected `RepoService`** answers before and after the switch — screens and hooks rebuild nothing; only the cache key (and, in production, the routed adapter beneath the service) changes.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest DataSourceToggle SearchScreen.injection`
Expected: FAIL — `DataSourceToggle` module not found; no element `data-source-option-gitlab` on the screen; push not encoded.

- [ ] **Step 3: Implement the toggle and screen changes**

```tsx
// src/presentation/shared/components/DataSourceToggle.tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { DATA_SOURCE_IDS, type DataSourceId } from '@/domain/shared/DataSource';
import { useDataSource } from '@/presentation/di/DataSourceProvider';

const SOURCE_LABELS: Record<DataSourceId, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
};

export function DataSourceToggle() {
  const { colors, radius, spacing } = useTheme();
  const { source, setSource } = useDataSource();

  return (
    <View
      testID="data-source-toggle"
      accessibilityRole="tablist"
      style={[
        styles.track,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
      ]}
    >
      {DATA_SOURCE_IDS.map((id) => {
        const selected = id === source;
        return (
          <Pressable
            key={id}
            testID={`data-source-option-${id}`}
            accessibilityRole="button"
            accessibilityLabel={`Usar fonte ${SOURCE_LABELS[id]}`}
            accessibilityState={{ selected }}
            onPress={() => setSource(id)}
            style={{
              borderRadius: radius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              backgroundColor: selected ? colors.background : 'transparent',
            }}
          >
            <Text size="xs" weight={selected ? 'bold' : 'medium'} tone={selected ? undefined : 'muted'}>
              {SOURCE_LABELS[id]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 2,
  },
});
```

(If `accessibilityRole="tablist"` is rejected by the RN type for `View`, drop that prop — the testID and per-option `accessibilityState` carry the test.)

`SearchScreen.tsx` — two changes:

1. Header block (replace the current `<Box paddingHorizontal="md" …><Heading level={2}>GitHub Explorer</Heading></Box>` inside the `GlassView`):

```tsx
        <Box
          paddingHorizontal="md"
          paddingTop="sm"
          paddingBottom="sm"
          direction="row"
          align="center"
          justify="space-between"
        >
          <Heading level={2}>Repo Explorer</Heading>
          <DataSourceToggle />
        </Box>
```

with the import `import { DataSourceToggle } from '@/presentation/shared/components/DataSourceToggle';`.

2. Encoded push in `handleRepoPress`:

```tsx
  const handleRepoPress = useCallback(
    (repo: Repository) => {
      router.push(
        `/repository/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}`,
      );
    },
    [router],
  );
```

`RepositoryDetailScreen.tsx` — encoded push to issues:

```tsx
        onViewIssues={() =>
          router.push(
            `/repository/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`,
          )
        }
```

(The existing detail-screen test expecting `'/repository/facebook/react/issues'` still passes — encoding is the identity for those values.)

> **Known limitation — do not claim otherwise.** `encodeURIComponent` makes the pushed *string* correct, but expo-router decodes path segments before matching, so a GitLab namespace containing `/` (nested subgroup, e.g. `grupo/subgrupo`) produces an extra path segment and will not match `[owner]/[repo]`. Top-level namespaces — which is what `order_by=star_count` search returns in practice (`gitlab-org/gitlab`) — work correctly. Do **not** add a custom separator or double-encoding to work around this: both leak source-specific knowledge into presentation, which is exactly what the requirement forbids. Record it in ADR-006 under Consequences as a known limitation with the reason it was not worked around.
>
> **Correction (post-implementation, 2026-08-26):** this limitation is not real. expo-router 6.0.23 matches the *still-encoded* path (`getUrlWithReactNavigationConcessions` keeps `%2F`, `configRegExp` compiles `:param` to `([^/]+\/)`) and decodes only after the match, so `/repository/grupo%2Fsubgrupo/projeto` resolves to `[owner]/[repo]` with `owner === 'grupo/subgrupo'`. The instruction not to add a separator or double-encoding still stands. See ADR-006 Consequences.

- [ ] **Step 4: Run the full gates**

Run: `npm run type-check && npm run lint && npm test`
Expected: all PASS, including the untouched `SearchScreen.test.tsx` (its hook is mocked; the toggle renders fine under the provider).

- [ ] **Step 5: Commit**

```bash
git add src/presentation
git commit -m "feat(presentation): add data-source toggle to search header with encoded route segments"
```

---

### Task 13: ADR-006, README, architecture rules, env example, final verification

**Files:**
- Create: `docs/decisions/006-runtime-switchable-data-sources.md`
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE-RULES.md` (§4 structure map)
- Modify: `.env.example`

- [ ] **Step 1: Write the ADR**

```markdown
# ADR-006: Runtime-switchable data sources behind a single routing point

## Status

Accepted

## Date

2026-08-26

## Context

The application must let the user switch between two equivalent public data sources — GitHub and
GitLab — at runtime, without restarting the app, remounting screens, or touching UI code. The two
APIs differ in field names (`stargazers_count` vs `star_count`), concept vocabulary (`issues.number`
vs `iid`, `state: open` vs `opened`), repository addressing (`owner/repo` path segments vs numeric
project id or URL-encoded full path), label shape (objects with colors vs plain strings), and
pagination transport (body `total_count` vs `x-total`/`x-next-page` response headers). The existing
architecture had one provider folder (`infrastructure/github`) wired directly into the composition
root, GitHub-shaped query keys, and GitHub-branded error copy in presentation.

## Decision

Declare the source vocabulary in the domain: `DataSourceId` (`'github' | 'gitlab'`), an observable
`DataSourceSelection` holding the active source, and a `DataSourcePreferenceStorage` port. These are
pure TypeScript with no imports, and they are the contract that infrastructure (routing),
presentation (selector, cache scope), and storage (persistence) share.

Give GitLab its own provider folder mirroring GitHub's: axios client translating GitLab failures
(429 → `rateLimit`; 403 stays `unknown`, unlike GitHub) into the domain `DataAccessError`, DTOs,
datasources returning raw bodies plus verbatim pagination headers, and repository adapters that map
GitLab vocabulary into the existing domain entities. GitLab resolves repositories by URL-encoded
full path, so the domain identity remains the `owner`/`name` pair and routes are unchanged apart
from URL-encoding the segments.

Make the switch a single data lookup: the composition root builds both provider stacks into a
`DataSourceRegistry` (`Record<DataSourceId, {repositories, issues}>`) and hands the application
layer `SourceRouted*Repository` adapters that resolve `registry[selection.current]` per call. Use
cases, services, hooks, and screens are unaware a second source exists. The compiler enforces
registry completeness when a new source id is added.

React integration: a `DataSourceProvider` exposes the container's selection through
`useSyncExternalStore` and persists changes via the storage port (AsyncStorage in production,
mirroring the theme-preference pattern). Every TanStack Query key carries the source as an opaque
scope, so switching changes keys, triggers fresh fetches with the ordinary loading states, and
retains the previous source's cache for instant switch-back.

Fields GitLab cannot supply became explicitly nullable in the domain (`watchersCount`,
`subscribersCount`, `networkCount`, `size`, `defaultBranch`, `Owner.avatarUrl`,
`IssueLabel.color`), and the UI degrades uniformly (conditional stat, avatar initials fallback,
neutral badge tone) without branching on source. Page size was aligned to the specification's
`per_page=20` for both providers, each keeping its own constant.

## Alternatives considered

### Rebuild the composition root when the source changes

Swapping service singletons at runtime would force React to remount providers to pick up new
instances, dropping the query cache and in-flight state — precisely the reload the requirement
forbids. Rejected.

### Choose the service per source inside hooks or a context switch in presentation

Selecting `githubRepoService` vs `gitlabRepoService` in `useSearchRepos` spreads the decision
across every hook and leaks source awareness into presentation. The requirement asks for one
decision in one place. Rejected.

### One datasource class with conditionals per method

A single `AxiosRepositoryDataSource` branching on the source inside each method would mix both wire
formats in one file, defeating per-provider encapsulation and turning every new source into edits
across all methods. Rejected.

### Carry the GitLab numeric project id in routes and entities

Routing by numeric id would need source-conditional route construction and a source-shaped domain
identity. The URL-encoded full path is documented, works unauthenticated, and keeps the identity
source-agnostic. Rejected.

### Request label details from GitLab (`with_labels_details=true`)

An extra request parameter could return label colors, but the contract must tolerate sources that
genuinely lack a field. Making `IssueLabel.color` nullable handles every future source; the neutral
badge tone is an acceptable, uniform degradation. Rejected.

## Consequences

- Adding a source is: new `infrastructure/<provider>` folder, one id in `DATA_SOURCE_IDS`, one
  registry entry, one label in the toggle map. The compiler lists the gaps.
- Business logic (`SearchReposUseCase`, `GetRepoDetailsUseCase`, `ListRepoIssuesUseCase`) is
  byte-for-byte identical for both sources; GitLab's issues endpoint never returns merge requests,
  so the pull-request filter is a harmless no-op there.
- Both sources produce the same `Page<T>`; GitLab's header-based totals may be absent, which
  `Page.total: number | null` already models.
- Query cache entries are namespaced per source; switching back is instant within `staleTime`.
- Presentation no longer contains GitHub-branded shared components; rate-limit copy is
  source-neutral.
- The `github` prefix in storage keys (`@github_explorer/*`) and the app name remain for
  backward compatibility of persisted preferences.
```

- [ ] **Step 2: Update README.md**

Precise edits (Portuguese, matching the document's voice):
1. Top description line: append GitLab — "Aplicativo React Native para buscar repositórios, visualizar detalhes e listar issues abertas no GitHub **ou GitLab, com troca de fonte em tempo de execução**…".
2. "Requisitos atendidos" table — add row:
   `| Troca de fonte de dados em tempo de execução (GitHub/GitLab) | ✅ | Registry no composition root + repositórios roteados por fonte; toggle no header da busca; preferência persistida |`
3. "Funcionalidades" — add bullet: `- **Fonte de dados alternável** — GitHub ou GitLab via controle segmentado no header da busca; troca sem reiniciar, cache isolado por fonte e preferência persistida`.
4. "Variáveis de ambiente" — add `EXPO_PUBLIC_GITLAB_TOKEN=glpat_seu_token_aqui` to the env block with a sentence: GitLab aplica rate limit por IP para requisições não autenticadas; um Personal Access Token (escopo `read_api`) é opcional.
5. "Estrutura do projeto" tree — under `infrastructure/`, add the `gitlab/` folder (mirror of the `github/` block: `AxiosGitLab*DataSource.ts`, `GitLab*DataSource.ts`, `GitLab*Repository.ts`, `client.ts`, `constants.ts`, `dtos.ts`, `pageHeaders.ts`, `mappers.ts`); under `infrastructure/di`, mention `DataSourceRegistry` + `SourceRouted*Repository`; under `presentation/`, remove the `github/` line and add `shared/components` (`DataAccessErrorState`, `DataSourceToggle`) and `shared/navigation`; under `domain/shared`, mention `DataSource`, `DataSourceSelection`, `DataSourcePreferenceStorage`.
6. "Decisões arquiteturais" — add a short subsection "Fontes de dados alternáveis em tempo de execução" summarizing the registry/single-decision design and linking `docs/decisions/006-runtime-switchable-data-sources.md`.
7. Tests badge: update the count to the final number reported by `npm test` after this task.

- [ ] **Step 3: Update docs/ARCHITECTURE-RULES.md §4 (Estrutura real)**

In the tree: add `│   ├── gitlab/            espelho de github/ para a API do GitLab → GitLab` under `infrastructure/`; extend the `di/` line to `di/ container.ts + DataSourceRegistry + SourceRouted*Repository — composition root`; replace the `├── github/` line under `presentation/` with nothing (folder removed) and extend `shared/` to `queryKeys, formatCount, hooks/useDebounce, components/, navigation/`; add `DataSource*, ` to the `domain/shared` line.

- [ ] **Step 4: Update .env.example**

```env
# Expo SDK 49+: public env vars must have the EXPO_PUBLIC_ prefix to be
# accessible in app code. Copy this file to .env and fill in your values.
EXPO_PUBLIC_GITHUB_TOKEN=
EXPO_PUBLIC_GITLAB_TOKEN=
```

- [ ] **Step 5: Final verification — gates plus every architecture grep**

```bash
npm run type-check && npm run lint && npm test
grep -rn "^import" src/domain --include="*.ts" | grep -v "from '\./\|from '\.\./"   # empty
grep -rn "@/infrastructure" src/application                                          # empty
grep -rn "async-storage\|@/application\|@/infrastructure" src/design-system           # empty
grep -rn "@/infrastructure" src/presentation | grep -v "/di/"                         # empty
grep -rn "gitlab\|github" src/presentation/repositories/screens src/presentation/issues/screens --include="*.tsx" -il | xargs -I{} sh -c 'grep -n "if.*source\|=== .github.\|=== .gitlab." {}'  # no source branching in screens
```
Expected: all green, all greps empty.

- [ ] **Step 6: Commit**

```bash
git add docs README.md .env.example
git commit -m "docs: record runtime-switchable data sources (ADR-006) and update README/env"
```

---

## Self-review notes

- **Spec coverage:** selection UI (Task 12); no restart/remount/UI change (Tasks 7–10: per-call routing + key-scoped refetch, proven by the injection test that reuses one service across the switch); identical screens/states/pagination (screens untouched except header/encoding; both adapters emit `Page<T>`); different wire formats encapsulated per provider (Tasks 4–6); single domain contract (Tasks 1–2); single decision point (Task 7, `registry[activeSource()]` in `infrastructure/di`); per-source HTTP layer (Tasks 4–5); GitLab 429 → `rateLimit` (Task 4); friendly rate-limit/no-results/no-connection messages preserved and neutralized (Task 11); persistence via AsyncStorage mirroring the theme pattern (Tasks 8–9); `per_page=20` decided and applied (Task 3); no credentials committed (`.env.example` placeholders only).
- **Type consistency spot-checks:** `DataSourceSelection.subscribe` is an arrow property (used bare in `useSyncExternalStore`, Task 9); `GitLabPageDto` field names `totalHeader`/`nextPageHeader` match between Tasks 4, 5, 6; `parsePositiveIntHeader` defined in Task 6 mappers and used only there; `queryKeys` scope-first signature matches all three hooks; `DataAccessErrorState` props identical to the old component so Task 11's mechanical swap is safe; `renderWithProviders` option name `dataSourceSelection` matches its uses in Tasks 9 and 12.
- **Known deliberate deviations:** `asyncStorageDataSourcePreference` singleton export mirrors the pre-existing `asyncStorageThemePreference` exception to the container-only rule (user decision to mirror that pattern; noted in Global Constraints). The app title heading becomes "Repo Explorer" to avoid a GitHub-branded header over GitLab data; the package/app name itself is unchanged.

## Requirement (spec)

> **3.3 — Fontes de dados alternáveis (verbatim):** O app deve permitir alternar, em tempo de execução, entre duas fontes de dados públicas equivalentes — GitHub e GitLab — para busca de repositórios, detalhes e issues.
>
> Comportamento esperado: uma tela (ou componente) de seleção permite ao usuário escolher a fonte ativa: GitHub ou GitLab. A troca de fonte não deve exigir reiniciar o app, recarregar a tela ou alterar qualquer código de UI. As telas de busca, detalhes e issues devem se comportar de forma idêntica independentemente da fonte selecionada — mesmos campos exibidos, mesmos estados de loading/erro/empty, mesma paginação. As duas APIs têm formatos de resposta diferentes entre si (nomes de campos, estrutura de paginação, nomenclatura de conceitos). Isso é intencional: o teste avalia como o candidato lida com a diferença sem vazá-la para o restante do app.
>
> Avaliado: se a lógica de negócio permanece a mesma independentemente da fonte; se a troca de fonte é isolada — idealmente uma única decisão em um único lugar do código, não múltiplos if/else espalhados por telas ou hooks; se cada fonte tem sua própria camada de consumo HTTP, mantendo suas particularidades de formato encapsuladas; contrato único de domínio para "repositório"/"issue", independente da fonte; infraestrutura traduz cada API para esse contrato.
>
> **5 — Endpoints:** GitHub (base `https://api.github.com`): `GET /search/repositories?q={query}&sort=stars&order=desc&page={n}&per_page=20`; `GET /repos/{owner}/{repo}`; `GET /repos/{owner}/{repo}/issues?state=open&page={n}&per_page=20`; 60 req/hora sem token; token opcional via `.env`. GitLab (base `https://gitlab.com/api/v4`): `GET /projects?search={query}&order_by=star_count&sort=desc&page={n}&per_page=20`; `GET /projects/{id}`; `GET /projects/{id}/issues?state=opened&page={n}&per_page=20`; `{id}` é o id numérico do projeto (retornado pela busca) ou o full path URL-encoded (`owner%2Frepo`); rate limit por IP sem autenticação; HTTP 429 deve ser tratado exatamente como o rate limit do GitHub (mapear para `DataAccessError` kind `rateLimit`); token opcional via `.env`. Ambas as APIs: mensagens amigáveis para rate limit, sem resultados e sem conexão. Nunca commitar credenciais.
