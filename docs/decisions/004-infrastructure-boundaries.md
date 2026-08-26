# ADR-004: Consolidate concrete infrastructure boundaries

## Status

Accepted

## Date

2026-08-26

## Context

Concrete dependency composition lived in application, production TanStack Query configuration
lived in presentation, and the design system imported AsyncStorage directly. GitHub repository
adapters also called Axios themselves. These placements obscured dependency direction and made the
design system less portable and repository rules dependent on HTTP module mocks.

## Decision

Keep the manual composition root in `infrastructure/di` and expose only its constructed application
services. Keep production QueryClient configuration in an infrastructure factory while the React
provider owns one stable client instance per mount.

Define theme preference persistence as a design-system port and implement it with AsyncStorage in
infrastructure. The app root injects the concrete implementation. Without an implementation, the
design system uses no-op persistence.

Split GitHub access into Axios datasources and repository adapters. Datasources build requests and
return raw DTOs. Repository adapters map DTOs and calculate pagination; issue filtering and
re-pagination remain in the application use case under ADR-002.

## Alternatives considered

### Move navigation into infrastructure

This was rejected because Expo Router's file-based routes are a framework constraint under `app`,
while stack header colors and titles are presentation behavior. Neither responsibility represents
an external data or persistence adapter.

### Move the complete theme module into infrastructure

This was rejected because tokens, theme state, React context, and `useTheme` form the design-system
API. Only the persistence mechanism is concrete infrastructure; moving the whole module would make
infrastructure own UI state and invert the intended dependency boundary.

### Keep repositories coupled directly to Axios

This was rejected because pagination and mapping tests would continue relying on fragile module
mocks. Constructor-injected datasources isolate transport tests from repository-rule tests without
introducing another top-level data layer.

## Consequences

- Application and domain no longer import infrastructure.
- Production library configuration and dependency construction have explicit homes.
- The design system can run without AsyncStorage and can test persistence through fakes.
- GitHub request construction and repository rules are independently testable.
- App composition imports infrastructure only to inject concrete implementations.
- Navigation remains in app and presentation rather than moving to infrastructure.
