# Code Review Style Guide

## Summary

This guide captures the review preferences behind recent config-file UI feedback.
Prefer structures that make rendering intent explicit, keep data ownership local, and reduce hidden coupling between unrelated views.

## Core Principles

1. Represent screen state explicitly.
2. Keep data fetching near the component that consumes the data.
3. Split large list rendering into item-focused components.
4. Prefer existing domain types over unnecessary view-model conversion.
5. Let the top-level UI decide what screen or pane is rendered.

## Screen State

- Do not introduce ad-hoc booleans like `showCreateForm` when the UI is really choosing between multiple screen modes.
- Model the current UI as an explicit state such as `'content' | 'create-entry'`.
- Update that state from event handlers, and let the main workbench view decide which UI to render.
- Prefer one central rendering decision over many scattered visibility checks.

## Data Ownership

- If a component is the only consumer of a list or loading state, fetch inside that component.
- Avoid pushing transient view concerns like list loading indicators into broad shared context.
- Shared providers should own truly shared coordination state, not every piece of local UI state.
- React Query is a good option when it simplifies async loading, cache, and loading state, but it is not mandatory if a smaller solution is clearer.

## Component Boundaries

- Extract list logic into dedicated components such as `EntryList`, `EntryItem`, `FileItem`, and `DirectoryItem`.
- Large inline `map()` blocks should usually become focused item components.
- Keep each component responsible for one rendering concern.
- Prefer small components that are easy to scan over one large component with recursive JSX mixed into business logic.

## Types

- Use the widest correct domain type when it already expresses the data you need.
- Do not create intermediate transformation helpers unless they remove real complexity.
- Avoid converting a `StorageConfigFile` into a narrower shape when the original type is already suitable.

## Rendering Structure

- Top-level containers should route to the correct pane or mode.
- Child components should focus on rendering their assigned state, not deciding whether they exist.
- Centralize view switching so future panes can be added without spreading conditionals across the tree.

## Review Heuristics

- Ask whether a boolean is hiding a richer state machine.
- Ask whether loading state is local or genuinely shared.
- Ask whether a large JSX block contains multiple concepts that should be named.
- Ask whether a helper is clarifying intent or only moving fields around.
- Prefer the smallest structural change that improves readability and maintainability.
