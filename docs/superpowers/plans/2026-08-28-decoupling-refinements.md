# Decoupling Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the three remaining decoupling refinements worth doing before submission — split the data-source selection into a domain port plus a composition-root implementation, delete a test-only export from a production module, and remove a content-free smoke test that inflates the advertised test count.

**Architecture:** Clean Architecture + Ports & Adapters, five layers with dependencies always pointing inward, boundaries enforced as `no-restricted-imports` ESLint errors. The only structural change here applies §1.2 of the rules doc ("interface antes de implementação") to the one collaborator that skipped it: `DataSourceSelection` becomes an interface in `domain/shared/` and its observable implementation moves to `infrastructure/di/`, mirroring the existing `DataSourcePreferenceStorage` / `AsyncStorageDataSourcePreference` split. That amends a placement made by ADR-006, so it carries a superseding ADR (ADR-011).

**Tech Stack:** Expo SDK 54 / React Native 0.81, TypeScript strict, Jest + React Native Testing Library, ESLint flat config, Prettier (printWidth 100).

**Spec:** Technical-test §2, last bullet — *"Desacoplamento: domínio isolado, inversão de dependências, interfaces antes de implementações."* The requirement is already fully met; this plan is refinement, not repair. The in-repo constitution is `docs/ARCHITECTURE-RULES.md` (11 sections); prior decisions are `docs/decisions/001..010` and every task below was checked against them.

## Global Constraints

- `npm run verify` (type-check + lint + test) must be green after **every** task. At planning time: 37 suites / 184 tests.
- **No git operations.** No commit, branch, or push — the repo owner commits their own work. Skill-template "Commit" steps are deliberately omitted.
- README and `docs/ARCHITECTURE-RULES.md` are pt-BR. ADRs are English, numbered, format: Status / Date / Context / Decision / Alternatives considered / Consequences. Next free ADR number: **011**. Date for new ADRs: **2026-08-28**.
- No decorative comments in code — the repo strips them; only functional lint directives are allowed.
- Instantiating a concrete class in production code is allowed only in `src/infrastructure/di/container.ts` (§9). Tests may instantiate their own subjects and fakes, as they already do.
- Per-layer test patterns are §8: domain = pure functions, no mocks; application = literal fake implementing the port; presentation = `renderWithProviders` with injected fakes; `jest.mock('../client')` only in `Axios*DataSource` tests.
- Prettier `printWidth: 100`; `prettier/prettier` is a lint **warning**, so a formatting drift does not fail `verify`, but keep lines ≤ 100 anyway.
- The README test badge (`README.md:8`) must equal the total `npm test` reports after the task that changes it. (Note: contrary to the task brief, the `## Uso de IA` section contains **no** test count — the badge is the only place the number appears in the README. Older plan files under `docs/superpowers/plans/` mention 37/184; those are dated records and are **not** updated.)

## Overview: what is in, what was dropped, and why

Six candidates were assessed against ADRs 001–010 and the rules doc. Three survive:

| # | Candidate | Verdict |
| --- | --- | --- |
| Task 1 | **(D)** `applicationServicesWithRepo` — test-only helper exported from `ApplicationProvider.tsx` | **Do.** Reshaped: inline at its single consumer and delete, rather than move to `__test-utils__`. One test file uses it three times; the inline literal `{ repoService: repositoryService }` is already fully type-checked by the `services: Partial<ApplicationServices>` prop, so a shared helper adds indirection with no contract gain. |
| Task 2 | **(A)** `DataSourceSelection` — concrete observable class in `domain/shared/` | **Do**, reshaped as port-in-domain + implementation-in-`infrastructure/di/`. The naive version ("move the class to infra") is dead on arrival: `presentation/` types the provider prop with it and lint bars presentation from `@/infrastructure`. The port stays reachable from every layer; only the mechanism (mutable listener `Set`, arrow-bound `subscribe` for `useSyncExternalStore` reference stability) moves next to the code that instantiates it. This amends ADR-006's placement of the observable, so the task includes ADR-011 arguing against the original reasoning explicitly. |
| Task 3 | **(F)** `smoke.test.ts` = `expect(1 + 1).toBe(2)` | **Do.** Not a decoupling issue, but it inflates a count the README badge advertises, which is a credibility risk in a submission that leads with its test discipline. Removal + badge correction is two minutes and independently revertible. |

Dropped, with the record cited:

- **(B) Extract the persistence race from `DataSourceProvider` into a use case — dropped.** ADR-006 *decided* this integration point: "Integrate with React through `presentation/di/DataSourceProvider`, which exposes the container's selection with `useSyncExternalStore` and persists changes through the storage port — AsyncStorage in production, mirroring the theme-preference pattern of ADR-004." The behaviour is ~6 lines, has no domain rule in it (it sequences two port calls around a ref), and the race rule is already pinned by a regression test: `DataSourceProvider.test.tsx` → *"keeps an explicit user choice when a persisted source resolves late"*. The claim that it is "testable only by mounting React" is technically true but the mounted test exists, is fast, and tests the rule where it lives. A `ChangeDataSourceUseCase` would be a class wrapping `selection.set` + `storage.save` — ceremony that ADR-002's own reasoning (use cases exist for validation and orchestration *of the domain*) does not cover. No superseding ADR is defensible here.
- **(C) Parameterise services by source instead of routing through a closure — dropped.** ADR-006 chose per-call routing at the composition root precisely so "use cases, services, hooks, and screens never learn that a second source exists", and rejected the neighbouring alternatives (per-hook selection, rebuilding the root). Parameterising by source would push `DataSourceId` into application signatures — spreading outward exactly what ADR-006 centralised. Concurrent multi-source consumption is not a requirement of this app, and the stated test cost is not real: `src/infrastructure/di/__tests__/sourceRouting.test.ts` constructs a **local** selection and registry per test; no test mutates the production global.
- **(E) Delete `issueRules.isPullRequest` — dropped.** §5.1 mandates that pure rules live in `*Rules.ts` beside the entity; ADR-009 explicitly rejected moving the filtering decision into the GitHub adapter ("it moves a decision the application owns into one provider"); and the named call site `!isPullRequest(issue)` in `ListRepoIssuesUseCase.ts` is the documented seam where a richer classification would go. Today the function is a one-line accessor, but deleting it saves one line, requires doc edits, and argues against two standing records for zero decoupling gain.

Task ordering: each task stands alone and the plan can stop after any of them. Task 3's badge step includes the arithmetic for both "after Task 2" and "Task 2 skipped".

---

### Task 1: Delete the test-only export from `ApplicationProvider`

`ApplicationProvider.tsx` exports `applicationServicesWithRepo`, whose only consumer is one test file. A production module should not carry test-only surface. The helper's output shape is already type-checked at the prop (`services: Partial<ApplicationServices>`), so the fix is inline-and-delete.

**Files:**
- Modify: `src/presentation/repositories/screens/__tests__/SearchScreen.injection.test.tsx`
- Modify: `src/presentation/providers/ApplicationProvider.tsx`

**Interfaces:**
- Consumes: `ApplicationProvider`'s `services` prop, typed `Partial<ApplicationServices>` (unchanged).
- Produces: nothing new — removes the exported symbol `applicationServicesWithRepo`. No other task references it.

- [ ] **Step 1: Inline the helper at its three call sites**

In `src/presentation/repositories/screens/__tests__/SearchScreen.injection.test.tsx`, delete this import line:

```tsx
import { applicationServicesWithRepo } from '@/presentation/providers/ApplicationProvider';
```

Then replace **all three** occurrences of:

```tsx
    renderWithProviders(<SearchScreen />, {
      services: applicationServicesWithRepo(repositoryService),
    });
```

with:

```tsx
    renderWithProviders(<SearchScreen />, { services: { repoService: repositoryService } });
```

(The three occurrences are identical; a replace-all on the exact block is safe.)

- [ ] **Step 2: Run the test to confirm it still passes with the inline literal**

Run: `npx jest src/presentation/repositories/screens/__tests__/SearchScreen.injection.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 3: Delete the export from the production module**

In `src/presentation/providers/ApplicationProvider.tsx`, delete the trailing block (the file then ends after `useIssueService`):

```tsx
export const applicationServicesWithRepo = (
  service: RepoService,
): Partial<ApplicationServices> => ({ repoService: service });
```

- [ ] **Step 4: Confirm the symbol is gone from the codebase**

Run: `grep -rn "applicationServicesWithRepo" src`
Expected: no output.

- [ ] **Step 5: Full gate**

Run: `npm run verify`
Expected: green — 37 suites / 184 tests (counts unchanged by this task).

---

### Task 2: `DataSourceSelection` becomes a domain port; the observable moves to the composition root (ADR-011)

The domain currently holds one concrete, stateful class: `DataSourceSelection`, with a mutable listener `Set` and an arrow-bound `subscribe` whose shape exists for React's `useSyncExternalStore` (the provider passes `selection.subscribe` **detached**, so a prototype method would lose `this`; the arrow property also gives React a stable function identity). ADR-006 placed this class in `domain/shared/` as part of the shared source vocabulary — this task keeps the *contract* there and moves the *mechanism* to `infrastructure/di/`, where `container.ts` already instantiates it. That is an amendment to ADR-006, so ADR-011 is part of this task, and the docs that describe the tree are updated in the same task.

Presentation files (lint-barred from `@/infrastructure`) that today construct the class get a literal fake in `presentation/__test-utils__/`, the same pattern §8 mandates for port fakes.

**Files:**
- Modify: `src/domain/shared/DataSourceSelection.ts` (class → interface)
- Create: `src/infrastructure/di/ObservableDataSourceSelection.ts`
- Create: `src/infrastructure/di/__tests__/ObservableDataSourceSelection.test.ts`
- Delete: `src/domain/shared/__tests__/DataSourceSelection.test.ts`
- Create: `src/domain/shared/__tests__/DataSource.test.ts` (keeps the `isDataSourceId` half of the deleted file)
- Modify: `src/infrastructure/di/container.ts`
- Modify: `src/infrastructure/di/__tests__/sourceRouting.test.ts`
- Create: `src/presentation/__test-utils__/fakeDataSourceSelection.ts`
- Modify: `src/presentation/__test-utils__/renderWithProviders.tsx`
- Modify: `src/presentation/providers/__tests__/DataSourceProvider.test.tsx`
- Modify: `src/presentation/shared/components/__tests__/DataSourceToggle.test.tsx`
- Create: `docs/decisions/011-data-source-selection-port.md`
- Modify: `docs/ARCHITECTURE-RULES.md` (§4 tree, two spots)
- Modify: `README.md` (structure tree ×2, data-sources paragraph, test badge)

**Not modified (verify, don't touch):** `src/presentation/providers/DataSourceProvider.tsx` and `src/app/_layout.tsx` — both already import the name `DataSourceSelection` as a **type** from `@/domain/shared/DataSourceSelection` (the provider) or receive the instance from `@/infrastructure/di` (the layout); the interface satisfies both unchanged. `src/infrastructure/di/index.ts` re-exports `dataSourceSelection` from `./container` and is also unchanged.

**Interfaces:**
- Consumes: `DataSourceId` from `src/domain/shared/DataSource.ts` (unchanged).
- Produces:
  - `interface DataSourceSelection { readonly current: DataSourceId; set(next: DataSourceId): void; readonly subscribe: (listener: () => void) => () => void }` in `src/domain/shared/DataSourceSelection.ts`.
  - `class ObservableDataSourceSelection implements DataSourceSelection` with `constructor(initial: DataSourceId)` in `src/infrastructure/di/ObservableDataSourceSelection.ts`.
  - `function fakeDataSourceSelection(initial?: DataSourceId): DataSourceSelection` in `src/presentation/__test-utils__/fakeDataSourceSelection.ts`.
  - Test totals move from 37 suites / 184 tests to **38 suites / 185 tests** (one suite split into two, one new test added).

- [ ] **Step 1: Write the failing test for the relocated implementation**

Create `src/infrastructure/di/__tests__/ObservableDataSourceSelection.test.ts`. The first four tests are the existing selection tests moved verbatim (renamed class); the fifth is new and pins the detached-call contract that `useSyncExternalStore` relies on:

```ts
import { ObservableDataSourceSelection } from '../ObservableDataSourceSelection';

describe('ObservableDataSourceSelection', () => {
  it('starts on the provided source', () => {
    expect(new ObservableDataSourceSelection('github').current).toBe('github');
    expect(new ObservableDataSourceSelection('gitlab').current).toBe('gitlab');
  });

  it('notifies subscribers after the source changes', () => {
    const selection = new ObservableDataSourceSelection('github');
    const seen: string[] = [];
    selection.subscribe(() => seen.push(selection.current));

    selection.set('gitlab');

    expect(seen).toEqual(['gitlab']);
    expect(selection.current).toBe('gitlab');
  });

  it('does not notify when setting the already-active source', () => {
    const selection = new ObservableDataSourceSelection('github');
    let calls = 0;
    selection.subscribe(() => {
      calls += 1;
    });

    selection.set('github');

    expect(calls).toBe(0);
  });

  it('stops notifying after unsubscribe', () => {
    const selection = new ObservableDataSourceSelection('github');
    let calls = 0;
    const unsubscribe = selection.subscribe(() => {
      calls += 1;
    });

    unsubscribe();
    selection.set('gitlab');

    expect(calls).toBe(0);
  });

  it('supports subscribe detached from the instance', () => {
    const selection = new ObservableDataSourceSelection('github');
    const { subscribe } = selection;
    let calls = 0;
    subscribe(() => {
      calls += 1;
    });

    selection.set('gitlab');

    expect(calls).toBe(1);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails for the right reason**

Run: `npx jest src/infrastructure/di/__tests__/ObservableDataSourceSelection.test.ts`
Expected: FAIL — `Cannot find module '../ObservableDataSourceSelection'`.

- [ ] **Step 3: Create the implementation**

Create `src/infrastructure/di/ObservableDataSourceSelection.ts` — the body is the current domain class, unchanged, now `implements` the (still-class-typed, soon-interface) domain name. The arrow-property `subscribe` is load-bearing: `DataSourceProvider` passes it detached to `useSyncExternalStore`.

```ts
import type { DataSourceId } from '@/domain/shared/DataSource';
import type { DataSourceSelection } from '@/domain/shared/DataSourceSelection';

export class ObservableDataSourceSelection implements DataSourceSelection {
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

(`implements` against the current domain **class** type is legal TypeScript, so this step compiles before the interface conversion in Step 5 — no broken intermediate state.)

- [ ] **Step 4: Run the new suite to confirm it passes**

Run: `npx jest src/infrastructure/di/__tests__/ObservableDataSourceSelection.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Convert the domain file to a pure contract**

Replace the entire content of `src/domain/shared/DataSourceSelection.ts` with:

```ts
import type { DataSourceId } from './DataSource';

export interface DataSourceSelection {
  readonly current: DataSourceId;
  set(next: DataSourceId): void;
  readonly subscribe: (listener: () => void) => () => void;
}
```

(`subscribe` is a function-typed **property**, not a method, to document that callers may invoke it detached from the instance.)

- [ ] **Step 6: Split the domain test file**

Delete `src/domain/shared/__tests__/DataSourceSelection.test.ts` and create `src/domain/shared/__tests__/DataSource.test.ts` containing the `isDataSourceId` half verbatim:

```ts
import { DATA_SOURCE_IDS, isDataSourceId } from '../DataSource';

describe('isDataSourceId', () => {
  it.each(DATA_SOURCE_IDS)('accepts %s', (id) => {
    expect(isDataSourceId(id)).toBe(true);
  });

  it.each(['bitbucket', '', null, undefined, 42])('rejects %p', (value) => {
    expect(isDataSourceId(value)).toBe(false);
  });
});
```

```bash
rm /Users/rodrigoandradebccgmail.com/Dev/Study/github-explorer/src/domain/shared/__tests__/DataSourceSelection.test.ts
```

- [ ] **Step 7: Rewire the composition root**

Replace the entire content of `src/infrastructure/di/container.ts` with (three changes from today: the domain import becomes `import type`, the relative import of the new class is added, and the instantiation line uses the new class with the export typed as the port — that line is exactly 100 characters, which fits `printWidth: 100`):

```ts
import { IssueService } from '@/application/issues/IssueService';
import { ListRepoIssuesUseCase } from '@/application/issues/ListRepoIssuesUseCase';
import { GetRepoDetailsUseCase } from '@/application/repositories/GetRepoDetailsUseCase';
import { RepoService } from '@/application/repositories/RepoService';
import { SearchReposUseCase } from '@/application/repositories/SearchReposUseCase';
import type { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import { AxiosGitHubIssueDataSource } from '@/infrastructure/github/AxiosGitHubIssueDataSource';
import { AxiosGitHubRepoDataSource } from '@/infrastructure/github/AxiosGitHubRepoDataSource';
import { GitHubIssueRepository } from '@/infrastructure/github/GitHubIssueRepository';
import { GitHubRepoRepository } from '@/infrastructure/github/GitHubRepoRepository';
import { AxiosGitLabIssueDataSource } from '@/infrastructure/gitlab/AxiosGitLabIssueDataSource';
import { AxiosGitLabRepoDataSource } from '@/infrastructure/gitlab/AxiosGitLabRepoDataSource';
import { GitLabIssueRepository } from '@/infrastructure/gitlab/GitLabIssueRepository';
import { GitLabRepoRepository } from '@/infrastructure/gitlab/GitLabRepoRepository';
import { AsyncStorageDataSourcePreference } from '@/infrastructure/storage/AsyncStorageDataSourcePreference';
import { AsyncStorageThemePreference } from '@/infrastructure/storage/AsyncStorageThemePreference';

import type { DataSourceRegistry } from './DataSourceRegistry';
import { ObservableDataSourceSelection } from './ObservableDataSourceSelection';
import { SourceRoutedIssueRepository } from './SourceRoutedIssueRepository';
import { SourceRoutedRepoRepository } from './SourceRoutedRepoRepository';

export const dataSourceSelection: DataSourceSelection = new ObservableDataSourceSelection('github');

export const dataSourcePreference = new AsyncStorageDataSourcePreference();
export const themePreference = new AsyncStorageThemePreference();

const registry: DataSourceRegistry = {
  github: {
    repos: new GitHubRepoRepository(new AxiosGitHubRepoDataSource()),
    issues: new GitHubIssueRepository(new AxiosGitHubIssueDataSource()),
  },
  gitlab: {
    repos: new GitLabRepoRepository(new AxiosGitLabRepoDataSource()),
    issues: new GitLabIssueRepository(new AxiosGitLabIssueDataSource()),
  },
};

const repositoryRepository = new SourceRoutedRepoRepository(
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

- [ ] **Step 8: Update the infrastructure routing test to use the concrete class**

In `src/infrastructure/di/__tests__/sourceRouting.test.ts`, replace the import:

```ts
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
```

with nothing there, and add to the relative import group (alphabetically, right after `import type { DataSourceRegistry } from '../DataSourceRegistry';`):

```ts
import { ObservableDataSourceSelection } from '../ObservableDataSourceSelection';
```

Then replace **both** occurrences of `new DataSourceSelection(` with `new ObservableDataSourceSelection(` — one `('github')` in the repo describe block, one `('gitlab')` in the issues describe block. Replace-all on the call prefix is safe; this test is in infrastructure, so using the real class is both allowed and preferable.

- [ ] **Step 9: Create the presentation-side port fake**

Presentation is lint-barred from `@/infrastructure`, so its tests can no longer construct the concrete class. Create `src/presentation/__test-utils__/fakeDataSourceSelection.ts` — a literal implementing the port, the §8 pattern:

```ts
import type { DataSourceId } from '@/domain/shared/DataSource';
import type { DataSourceSelection } from '@/domain/shared/DataSourceSelection';

export function fakeDataSourceSelection(initial: DataSourceId = 'github'): DataSourceSelection {
  let active = initial;
  const listeners = new Set<() => void>();
  return {
    get current() {
      return active;
    },
    set(next) {
      if (next === active) return;
      active = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
```

- [ ] **Step 10: Point `renderWithProviders` at the fake**

Replace the entire content of `src/presentation/__test-utils__/renderWithProviders.tsx` with (two changes: the domain import becomes `import type`, and the default selection is the fake):

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react-native';
import React from 'react';

import { ThemeProvider } from '@/design-system';
import type { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
import {
  ApplicationProvider,
  type ApplicationServices,
} from '@/presentation/providers/ApplicationProvider';
import { DataSourceProvider } from '@/presentation/providers/DataSourceProvider';

import { fakeDataSourceSelection } from './fakeDataSourceSelection';

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
  const selection = dataSourceSelection ?? fakeDataSourceSelection('github');

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <DataSourceProvider selection={selection}>
        <ApplicationProvider services={services ?? {}}>
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

- [ ] **Step 11: Switch the two presentation test files to the fake**

In `src/presentation/providers/__tests__/DataSourceProvider.test.tsx`, replace the import:

```tsx
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
```

with (placed after the two `@/domain/shared` type imports, keeping alphabetical alias order):

```tsx
import { fakeDataSourceSelection } from '@/presentation/__test-utils__/fakeDataSourceSelection';
```

Then replace **all four** occurrences of `new DataSourceSelection('github')` with `fakeDataSourceSelection('github')`.

In `src/presentation/shared/components/__tests__/DataSourceToggle.test.tsx`, replace the import:

```tsx
import { DataSourceSelection } from '@/domain/shared/DataSourceSelection';
```

with (placed immediately before the `renderWithProviders` import — alphabetical within the `@/presentation/__test-utils__` group):

```tsx
import { fakeDataSourceSelection } from '@/presentation/__test-utils__/fakeDataSourceSelection';
```

and replace the single occurrence of `new DataSourceSelection('github')` with `fakeDataSourceSelection('github')`.

- [ ] **Step 12: Run the affected suites**

Run: `npx jest src/infrastructure/di src/presentation/providers src/presentation/shared/components/__tests__/DataSourceToggle.test.tsx src/domain/shared`
Expected: PASS across the board.

- [ ] **Step 13: Full gate + boundary greps**

Run: `npm run verify && grep -rn "require(" src/domain src/application; grep -rn "new DataSourceSelection\b" src`
Expected: verify green with **38 suites / 185 tests**; both greps print nothing (the second confirms no stray construction of the old class name survives).

- [ ] **Step 14: Write ADR-011**

Create `docs/decisions/011-data-source-selection-port.md`:

```markdown
# ADR-011: Split the data-source selection into a domain port and a composition-root observable

## Status

Accepted

## Date

2026-08-28

## Context

This amends one placement made by [ADR-006](./006-runtime-switchable-data-sources.md). ADR-006
declared the source vocabulary in `domain/shared`: the `DataSourceId` union, the
`DataSourceSelection` observable, and the `DataSourcePreferenceStorage` port. Two of the three are
contracts. The third was a concrete class — the only stateful, instantiable class in the domain
layer.

Its shape is dictated by its one subscriber. `DataSourceProvider` hands `selection.subscribe` to
React's `useSyncExternalStore` detached from the instance, so the class declared `subscribe` as an
arrow-bound property to survive the detached call and keep a stable function identity across
renders. A mutable listener `Set` and a React-motivated binding convention lived in the layer that
holds rules and contracts, while the sibling concerns — theme preference, source preference —
already followed port-in-domain, implementation-in-infrastructure
([ADR-004](./004-infrastructure-boundaries.md), ADR-006).

The class was legal: pure TypeScript, no imports beyond the domain, instantiated only in
`infrastructure/di/container.ts`. The problem is not a broken rule but an asymmetry — §1.2 of the
rules document ("interface antes de implementação") applied to every collaborator except this one.

## Decision

`domain/shared/DataSourceSelection.ts` declares an interface: a readonly `current`, `set(next)`,
and `subscribe` typed as a function-valued property to document that callers may invoke it
detached. `infrastructure/di/ObservableDataSourceSelection.ts` implements it with the previous
class body, and `container.ts` instantiates it, exporting the instance typed as the port.

Consumers are untouched at the type level: `DataSourceProvider` and `renderWithProviders` already
imported the name from `domain/shared/DataSourceSelection` and continue to. Presentation tests,
which lint bars from importing infrastructure, build the port as a literal fake in
`presentation/__test-utils__/fakeDataSourceSelection.ts` — the pattern §8 mandates for port fakes.
The observable's behaviour, including detached-call safety, is tested where it now lives, in
`infrastructure/di`.

## Alternatives considered

### Keep the concrete class in the domain (the ADR-006 shape)

ADR-006's stated aim was a contract "that infrastructure, presentation, and storage share". A
contract does not need a listener `Set` to be shared — the interface carries the whole agreement,
and the mechanism sat in the domain only because interface and implementation had not been
separated. Keeping it meant the domain owned mutable process state and a binding convention chosen
for one UI library.

### Move the class to infrastructure without a domain port

This was rejected because `presentation/` types the provider prop with the selection and §3 bars
presentation from importing infrastructure. The contract must be declared in a layer both sides can
reach; that layer is the domain.

### Declare the port in presentation

This was rejected because the composition root implements and instantiates the selection, and
infrastructure cannot import presentation (§3). The arrow would point outward.

## Consequences

- `domain/` contains only entities, pure rules, errors, and contracts — no class with mutable
  state.
- The selection follows the same port/implementation split as `DataSourcePreferenceStorage` and
  `ThemePreferenceStorage`; `container.ts` remains the only production instantiation site.
- Presentation tests substitute a literal fake for the observable; divergence between fake and
  implementation is bounded by a three-member interface and the implementation's own tests.
- ADR-006's routing, registry, nullable-field, and provider decisions are unchanged; only the
  placement of the observable is amended. Following ADR-008's precedent, ADR-006's text stays as a
  dated record.
```

- [ ] **Step 15: Update `docs/ARCHITECTURE-RULES.md` §4 (two edits)**

Edit 1 — in the §4 tree, replace:

```
│   └── shared/            Page<T>, DataSource (DATA_SOURCE_IDS/DataSourceId),
│                          DataSourceSelection, DataSourcePreferenceStorage,
│                          Theme (THEME_MODES/ThemeMode), ThemePreferenceStorage
```

with:

```
│   └── shared/            Page<T>, DataSource (DATA_SOURCE_IDS/DataSourceId),
│                          DataSourceSelection (port), DataSourcePreferenceStorage,
│                          Theme (THEME_MODES/ThemeMode), ThemePreferenceStorage
```

Edit 2 — in the same tree, replace:

```
│   └── di/                container.ts + DataSourceRegistry + SourceRouted*Repository
│                          — composition root
```

with:

```
│   └── di/                container.ts + DataSourceRegistry + SourceRouted*Repository
│                          + ObservableDataSourceSelection — composition root
```

- [ ] **Step 16: Update `README.md` (four edits, pt-BR)**

Edit 1 — structure tree (currently line 152), replace:

```
│                               #   DataSourceSelection, DataSourcePreferenceStorage,
```

with:

```
│                               #   DataSourceSelection (port), DataSourcePreferenceStorage,
```

Edit 2 — the `infrastructure/di` tree block, replace:

```
│   ├── di/                     # Composition root manual + DataSourceRegistry
│   │   ├── container.ts                     # Monta os dois stacks e expõe os services
│   │   ├── DataSourceRegistry.ts            # Record<DataSourceId, { repos, issues }>
│   │   └── SourceRouted*Repository.ts       # Ports de domínio que resolvem a fonte ativa
```

with:

```
│   ├── di/                     # Composition root manual + DataSourceRegistry
│   │   ├── container.ts                     # Monta os dois stacks e expõe os services
│   │   ├── DataSourceRegistry.ts            # Record<DataSourceId, { repos, issues }>
│   │   ├── ObservableDataSourceSelection.ts # Implementação da porta DataSourceSelection
│   │   └── SourceRouted*Repository.ts       # Ports de domínio que resolvem a fonte ativa
```

Edit 3 — the "Fontes de dados alternáveis" paragraph, replace:

```
O domínio declara o vocabulário de fonte em `domain/shared/`: os ids (`DataSourceId`), o observável
`DataSourceSelection` e a porta `DataSourcePreferenceStorage`. Cada provider tem sua própria pasta
```

with:

```
O domínio declara o vocabulário de fonte em `domain/shared/`: os ids (`DataSourceId`) e as portas
`DataSourceSelection` e `DataSourcePreferenceStorage`; o observável concreto,
`ObservableDataSourceSelection`, vive no composition root
([ADR-011](docs/decisions/011-data-source-selection-port.md)). Cada provider tem sua própria pasta
```

Edit 4 — the test badge (line 8) must match the new total (185), replace:

```
![Tests](https://img.shields.io/badge/testes-184%20passando-brightgreen?logo=jest&logoColor=white)
```

with:

```
![Tests](https://img.shields.io/badge/testes-185%20passando-brightgreen?logo=jest&logoColor=white)
```

- [ ] **Step 17: Final gate**

Run: `npm run verify`
Expected: green — 38 suites / 185 tests. Also confirm the badge and reality agree: `npm test 2>&1 | grep "Tests:"` reports 185, and `grep -c "185%20passando" README.md` prints 1.

---

### Task 3: Remove the smoke test and correct the advertised test count

`src/presentation/shared/__tests__/smoke.test.ts` asserts `expect(1 + 1).toBe(2)` — it verifies nothing about the code and inflates the count the README badge advertises. Deleting it must land together with the badge correction so the README never overstates.

**Files:**
- Delete: `src/presentation/shared/__tests__/smoke.test.ts` (the directory's only file — remove the empty directory too)
- Modify: `README.md:8` (badge)

**Interfaces:**
- Consumes: the badge value written by Task 2 Step 16 (185) — or the original 184 if Task 2 was skipped.
- Produces: final totals **37 suites / 184 tests** after Tasks 1–3 (or 36 / 183 if Task 2 was skipped).

- [ ] **Step 1: Delete the test file and its now-empty directory**

```bash
rm /Users/rodrigoandradebccgmail.com/Dev/Study/github-explorer/src/presentation/shared/__tests__/smoke.test.ts
rmdir /Users/rodrigoandradebccgmail.com/Dev/Study/github-explorer/src/presentation/shared/__tests__
```

(`rmdir` fails if anything else was added to the directory since planning — in that case leave the directory in place.)

- [ ] **Step 2: Correct the badge**

In `README.md`, set the badge to the total `npm test` now reports. With Task 2 done (the expected path), replace:

```
![Tests](https://img.shields.io/badge/testes-185%20passando-brightgreen?logo=jest&logoColor=white)
```

with:

```
![Tests](https://img.shields.io/badge/testes-184%20passando-brightgreen?logo=jest&logoColor=white)
```

(If Task 2 was skipped, the current value is `184` and the replacement is `183`.)

- [ ] **Step 3: Full gate and badge/reality agreement**

Run: `npm run verify && npm test 2>&1 | grep -E "Test Suites:|Tests:"`
Expected: verify green; with Tasks 1–2 done, `Test Suites: 37 passed, 37 total` and `Tests: 184 passed, 184 total`, matching the badge. Confirm no references to the deleted file remain: `grep -rn "smoke" src README.md docs/ARCHITECTURE-RULES.md docs/decisions` prints nothing.
