# Infrastructure Boundaries Consolidation Design

## Goal

Consolidate concrete composition, library configuration, persistence, and transport-independent
error representation into explicit architectural boundaries. Preserve all visible behavior, query
settings, persisted theme compatibility, cache keys, and public UI text.

## Composition Root

Move the manual composition root from `application/container.ts` to
`infrastructure/di/container.ts`. The container is responsible for selecting concrete GitHub
repository adapters and constructing application use cases and services. It may import both
application and domain-facing infrastructure adapters.

`application/index.ts` exports only application classes and input types. It no longer hides
infrastructure values through re-exports. `infrastructure/di/index.ts` exposes the production
`repoService` and `issueService` instances, and `ApplicationProvider` imports only those instances
from infrastructure while keeping service types sourced from application.

After this move, application and domain have no imports from infrastructure.

## Query Client Configuration

Create `infrastructure/query/queryClient.ts` with a `createQueryClient()` factory. The factory
preserves the current five-minute default stale time, rate-limit-aware retry policy, one retry for
other errors, and disabled window-focus refetching.

`presentation/di/QueryProvider.tsx` becomes a React-only adapter. It creates one client per provider
instance with a lazy `useState` initializer and renders `QueryClientProvider`. The presentation test
helper continues creating its own isolated client with retries disabled and does not use production
configuration.

## Theme Preference Port

The design system defines `ThemePreferenceStorage` with asynchronous `load` and `save` operations.
`ThemeProvider` accepts an optional implementation. Without one, it performs no persistence:
loading resolves to no preference and saving resolves successfully without side effects.

`AsyncStorageThemePreference` in `infrastructure/storage` implements the port and retains the exact
`@github_explorer/theme_mode` key so existing user preferences remain readable. The Expo root layout
injects the production implementation into `ThemeProvider`.

The provider ignores storage values other than `light` and `dark`, as it does today. Persistence
errors remain non-blocking for toggle behavior. A design-system test supplies a fake storage,
resolves a stored mode, and verifies that consumers observe it without importing AsyncStorage.

## Domain Error

Move the `ApiError` class to `domain/errors/ApiError.ts` with no imports. It retains `status`,
`message`, and `isRateLimit`, allowing query policy and presentation error handling to depend on a
stable error representation rather than the Axios adapter.

The GitHub Axios interceptor remains responsible for translating transport failures into
`ApiError`. All consumers import the class directly from domain; application provides no
intermediate re-export.

## Negative Boundaries

Navigation configuration remains in `app/` and presentation. Expo Router's file layout is a
framework constraint, while GitHub stack header colors and titles are presentation behavior rather
than infrastructure.

Only theme persistence moves out of the design system. Theme tokens, context, `ThemeProvider`, and
`useTheme` remain in the closed design-system module. Infrastructure implements the storage port
but does not own theme state or rendering.

## Testing and Verification

Each of the four implementation steps is type-checked and reviewed before its requested commit.
Relevant tests run after persistence and error changes. README updates and ADR-004 are included in
the fourth implementation commit rather than a separate documentation commit.

Final verification requires no infrastructure imports from domain or application, no AsyncStorage
references in the design system, and no application or infrastructure imports in the design
system. Type-check, lint, and the complete Jest suite must pass with at least the existing 91 tests
plus the new theme-storage test, with no skipped tests.
