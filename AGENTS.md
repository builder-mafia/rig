# AGENTS.md

Guide for AI coding agents operating in this monorepo.

## Project Structure

```
apps/
├── tauri/     # Desktop app (Next.js + Tauri)
├── web/       # Web app (Next.js) // !important: deprecated. 
└── docs/      # Documentation
packages/
├── ui/        # Shared UI components (@allin/ui)
├── ai/        # AI utilities (@allin/ai)
├── utils/     # Shared utilities (@allin/utils)
├── db-atom/   # Database atoms
├── db-schema/ # Database schema
└── ...
```

## Commands

### Development
```bash
pnpm dev              # Run all apps in dev mode (turbo)
pnpm dev:app          # Run Tauri desktop app
```

### Build & Lint
```bash
pnpm build            # Build all packages
pnpm check-ts         # TypeScript check across all packages
pnpm lint:fix         # Biome lint fix (in apps/web)
```

### Testing
```bash
pnpm test             # Run all tests in watch mode
pnpm test:once        # Run all tests once

# Single test file (from apps/web)
cd apps/web && pnpm vitest run src/path/to/file.test.ts

# Single test with pattern
cd apps/web && pnpm vitest run -t "test name pattern"
```

## Code Style

### Formatter: Biome
- Indent: 2 spaces
- Line width: 80
- Single quotes, trailing commas
- Semicolons required
- Arrow parens: as needed

### TypeScript
- Strict mode enabled
- **Avoid `any` and `unknown`** - ask if unsure about types
- Use `@/*` path alias for imports in apps
- Prefer `type` imports: `import type { Foo } from './foo'`

### Import Order
1. External libraries (react, rxjs, etc.)
2. Internal packages (@allin/*)
3. Relative imports (@/business/*, ./*)

```typescript
import { BehaviorSubject } from 'rxjs';
import type { LLMProviderName } from '@allin/ai';
import { commandDialogManager } from './CommandDialogManager';
```

### Naming Conventions
- Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- Components: PascalCase (`CommandDialogManager`)
- Hooks: `use` prefix (`useCommandDialogView`)
- Types: PascalCase (`CommandViewState`)
- Constants: UPPER_SNAKE_CASE (`PROVIDER_INFO`)

## RxJS Patterns

This project uses RxJS for reactive state management.

### Event Handling
Use `fromEvent` instead of `addEventListener`:

```typescript
// Bad
document.addEventListener('keydown', handler);

// Good
fromEvent<KeyboardEvent>(document, 'keydown')
  .pipe(filter(e => e.key === 'j' && e.metaKey))
  .subscribe(handler);
```

### State Management
Use `BehaviorSubject` for state, `Subject` for events:

```typescript
class Manager {
  private state$ = new BehaviorSubject<State>(initialState);
  private event$ = new Subject<Event>();

  getState$(): Observable<State> {
    return this.state$.asObservable();
  }
}
```

### Singleton Pattern
```typescript
export class SessionMap {
  private static instance: SessionMap;

  private constructor() {}

  public static getInstance() {
    if (!SessionMap.instance) {
      SessionMap.instance = new SessionMap();
    }
    return SessionMap.instance;
  }
}
```

## UI Guidelines

- Use components from `@allin/ui` or `src/components`
- Can install shadcn components if needed
- Use Tailwind CSS for styling
- Icons: `lucide-react`, `@lobehub/icons`

## Core Principles

### YAGNI
- Implement only requested functionality
- Use TODO comments for future extensions
- No premature abstraction
- **If a field/type/feature has no consumer yet, don't add it**

### Simplicity First
- Prefer simple solutions over complex architectures
- Refactor when needed, not in advance

### Communication
- **Ask when uncertain** - don't make assumptions
- Keep responses concise and clear
- All comments and documentation in English

## Owner's Coding Style

### React Component Syntax
- Use arrow function syntax: `const Component = () => { ... }`
- NOT function declaration: `function Component() { ... }`

```typescript
// Good
export const MyComponent = () => {
  return <div>...</div>;
};

// Bad
export function MyComponent() {
  return <div>...</div>;
}
```

### Architecture: View / State Separation
- React components handle **rendering only**
- State logic lives in separate Singleton classes with RxJS `BehaviorSubject`
- Example: `ChatInputView.tsx` (UI) + `ChatInputState.ts` (state)
- This allows state to be accessed from outside React components

### Component Communication: RxJS Subject as Event Bus
- Use `Subject` to pass events between components that don't share focus
- Example: `modifierKeyEvent$` Subject created in parent, injected into child via props
- Preferred over prop callback chains for cross-component event flow

```typescript
// Parent creates Subject, child subscribes
const modifierKeyEvent$ = useMemo(
  () => new Subject<'ArrowUp' | 'ArrowDown' | 'Enter'>(),
  [],
);
// Pass to child as prop, child subscribes in useEffect
```

### Conditional Rendering over Open/Close Props
- Prefer `{isOpen && <Component />}` (mount/unmount) over `<Component isOpen={isOpen} />`
- The component itself is always "open" — parent controls its existence
- Popover with `open` always `true`, parent decides whether to render it at all

### Naming: Semantic Placeholders
- Use descriptive names that convey purpose: `$INPUT` (user text), `$HINT` (selected hint)
- Avoid generic/CLI-style names like `$ARGUMENTS`, `$1`, `$2`

### Manager = Pure Registry
- Manager/Singleton classes should only handle registration and data access
- **No filtering, searching, or UI logic inside Managers**
- Filtering belongs in the UI layer (e.g., `Fzf` fuzzy search in component)

### File Naming
- View components: `*View.tsx` (e.g., `ChatInputView.tsx`)
- State classes: `*State.ts` (e.g., `ChatInputState.ts`)
- Manager singletons: `*Manager.ts` (e.g., `SlashCommandManager.ts`)

### Union Branching: Use ts-pattern with exhaustive()
- Always use `ts-pattern` with `.exhaustive()` for union type branching
- Compiler will catch missing cases when new variants are added

```typescript
// Good
match(paneId)
  .with('home', () => <HomePane />)
  .with('settings', () => <SettingsPane />)
  .with(null, () => null)
  .exhaustive();

// Bad
{paneId === 'home' && <HomePane />}
{paneId === 'settings' && <SettingsPane />}
```

### Naming: Context-Specific over Generic
- Avoid generic names like `View`, `Data`, `Info`, `State`
- Use domain-specific terminology that fits the module context

```typescript
// Bad: too generic
CommandViewId, viewId, props

// Good: context-specific
CommandPaneId, paneId, paneProps
```

### Centralized Routing over Distributed State
- For multi-pane/multi-view UIs, route from a single root component
- Avoid each child component checking its own open state independently

```typescript
// Good: Root decides which pane to render
const CommandPalette = () => {
  const [openedPane] = useOpenedPane();
  return match(openedPane.paneId)
    .with('home', () => <HomePane />)
    .with('channels', () => <ChannelsPane />)
    .exhaustive();
};

// Bad: Each pane checks its own state
<>
  <HomePane />      {/* internally: if (currentPane === 'home') */}
  <ChannelsPane />  {/* internally: if (currentPane === 'channels') */}
</>
```

## Error Handling

- Never suppress errors silently
- Use proper error types, not generic `Error`
- Toast notifications for user-facing errors:

```typescript
toast.error('Error message', {
  position: 'top-center',
  duration: 15000,
});
```

## Testing

- Test framework: Vitest
- Test files: `*.test.ts` or `*.test.tsx`
- Place tests near source or in `test/` folder

```typescript
import { expect, it, describe } from 'vitest';

describe('Feature', () => {
  it('should work', () => {
    expect(1).toBe(1);
  });
});
```

## Key Libraries

| Library | Usage |
|---------|-------|
| rxjs | Reactive state, event streams |
| ts-pattern | Pattern matching |
| jotai | Atomic state (web app) |
| ai (Vercel) | AI SDK integration |
| cmdk | Command palette |
| @tauri-apps/api | Desktop app IPC |
