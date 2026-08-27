# ADR-009: Bound the issue page scan and let the caller resume it

## Status

Accepted

## Date

2026-08-27

## Context

GitHub's issues endpoint returns pull requests alongside issues; GitLab's does not.
`ListRepoIssuesUseCase` therefore filters pull requests out and, when a page yields nothing, walks
forward to the next one so the caller is not handed an empty list while open issues exist further
down.

The walk had no budget. Its only guard was a visited-page set, which catches an adapter that repeats
a page but not a long forward march. On a repository whose open items are mostly pull requests, one
`execute()` issued page after page of sequential requests before returning anything: the caller saw
a spinner for the whole march, and an unauthenticated client — 60 requests per hour — could spend the
budget for the hour inside a single screen open.

## Decision

The scan stops after `MAX_PAGES_SCANNED` (5) pages. When the budget runs out with nothing found, the
use case returns an empty page whose `nextPage` points at the page it did not read, so the walk is
resumable rather than abandoned.

`IssuesScreen` renders the empty state before the list exists, so `onEndReached` can never fire from
it. The empty state therefore takes an optional `onContinue`: when the query still has a next page,
it offers "Continuar procurando" and calls `fetchNextPage`; when it does not, it keeps the original
"Nenhuma issue aberta" wording. Spending more of the request budget becomes an explicit choice by the
person looking at the screen.

A repeated page still throws. Budget exhaustion and a broken adapter are different failures and the
resumable contract must not paper over the second one.

## Alternatives considered

### Keep the unbounded walk

This was rejected because the cost of a single call is unbounded by construction, and the failure is
worst exactly where the feature matters — a large, active repository.

### Bound the walk and stop, reporting no issues

This was rejected because it reports a falsehood. Issues past the budget exist; the use case simply
did not read that far.

### Auto-continue from the hook when a page comes back empty

This was rejected because it restores the original cost with extra steps. The same requests are
issued, only split across query pages, and nobody is asked.

### Filter pull requests inside the GitHub adapter

This was rejected because it moves a decision the application owns into one provider, and the walk
would still be needed — a filtered page still comes back short.

## Consequences

- A single `execute()` costs at most five requests.
- `Page<Issue>` can now be empty with a non-null `nextPage`; any consumer that reads emptiness as
  "there is nothing" has to check `hasNextPage` too. `IssuesScreen` does.
- `MAX_PAGES_SCANNED` is exported, so tests state the budget instead of hard-coding 5.
