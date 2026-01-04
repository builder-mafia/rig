# Extension Context

Context interface package for the ALLIN app extension system.

## Overview

Extensions are a plugin system that can extend app functionality. This package provides:
- **Interface definitions** for extensions to use
- **Dynamic loading** mechanism for extensions
- TypeScript types ensuring type safety

## Architecture

```
Extension (Interface Definition)
    ↑
    | depends on
    |
App (Implementation Injection)
    ↓
    | provides
    |
Extension Execution
```

## Core APIs

### ExtensionContext

Interface for extensions to access app features:

```typescript
interface ExtensionContext {
  selectionPopover: SelectionPopoverAPI;  // Text selection popover
  modal: ModalAPI;                        // Modal management
  sidebar: SidebarAPI;                    // Sidebar panel management
  ai: AIAPI;                             // AI features
}
```

### SelectionPopoverAPI

Add custom buttons to the popover that appears when text is selected:

```typescript
api.selectionPopover.add('my-button', ({ close, selectedText }) => {
  return (
    <button onClick={() => {
      console.log('Selected:', selectedText);
      close();
    }}>
      My Button
    </button>
  );
});
```

### ModalAPI

Open/close global modals:

```typescript
const modalId = api.modal.open(
  ({ close }) => (
    <div>
      <h1>My Modal</h1>
      <button onClick={close}>Close</button>
    </div>
  ),
  { size: 'lg', closeOnBackdropClick: true }
);
```

### SidebarAPI

Add custom panels to the sidebar (left/right panel):

```typescript
api.sidebar.add('my-panel', {
  title: 'My Panel',
  icon: '📋',
  content: ({ close, isOpen, panelId }) => (
    <div>
      <h2>My Extension Panel</h2>
      <p>Custom content here</p>
      <button onClick={close}>Close Panel</button>
    </div>
  ),
  options: {
    position: 'left',
    defaultOpen: false,
    width: 300,
    badge: 5, // Show notification badge
  },
});

// Control panel programmatically
api.sidebar.open('my-panel');
api.sidebar.close('my-panel');
api.sidebar.toggle('my-panel');
```

### AIAPI

Ask questions to AI:

```typescript
// Regular request
const response = await api.ai.ask('Hello', {
  model: 'gpt-4',
  temperature: 0.7,
});
console.log(response.content);

// Streaming
for await (const chunk of api.ai.stream('Long response request')) {
  console.log(chunk.delta); // Newly added part
  if (chunk.done) break;
}
```

## Creating an Extension

### 1. Create Extension Package

```bash
cd extensions
mkdir my-extension
cd my-extension
pnpm init
```

### 2. Implement Extension

```typescript
// src/index.ts
import type { Extension } from '@allin/extension';
import type { ExtensionContext } from '@allin/context';

export const myExtension: Extension = {
  id: 'my-extension',
  name: 'My Extension',
  version: '1.0.0',
  description: 'My custom extension',

  async activate(context: ExtensionContext) {
    // Extension initialization logic
    context.selectionPopover.add('my-feature', ({ close, selectedText }) => {
      return <button onClick={() => console.log(selectedText)}>Run</button>;
    });
  },

  async deactivate() {
    // Cleanup
  },
};
```

### 3. Configure package.json

```json
{
  "name": "@allin/extension-my-extension",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "@allin/context": "workspace:*",
    "@allin/extension": "workspace:*",
    "react": "catalog:react"
  }
}
```

## Using Extensions in the App

### 1. Create ExtensionContext Implementation

```typescript
// apps/web/src/extension-context-implement/ExtensionContextImpl.ts
import type { ExtensionContext } from '@allin/context';

export const extensionContextImpl: ExtensionContext = {
  // Implement the context
  // This should integrate with your app's state management system
};
```

You need to implement this to integrate with your app's state management system.

### 2. Dynamic Extension Loading

```typescript
import { ExtensionLoader } from './ExtensionLoader';

const loader = new ExtensionLoader(extensionContextImpl);

// Load only user-activated extensions
const activeExtensions = ['@allin/extension-quiz', '@allin/extension-summary'];

for (const ext of activeExtensions) {
  await loader.loadAndActivate(ext);
}

// Check list
console.log(loader.list());
// [{ name: '@allin/extension-quiz', id: 'quiz', version: '0.1.0', isActive: true }]
```

### 3. Using in UI Components

```typescript
// SelectionPopover.tsx
function SelectionPopover({ text }) {
  const context = useExtensionContext();
  const items = context.selectionPopover.list();

  return (
    <div>
      {items.map(id => {
        const Component = /* get component by id */;
        return <Component key={id} selectedText={text} close={() => {}} />;
      })}
    </div>
  );
}
```

## Extension Example

### Quiz Extension

Extension that generates quizzes from selected text using AI:

```typescript
export const quizExtension: Extension = {
  id: 'quiz',
  name: 'Quiz Generator',
  version: '0.1.0',

  async activate(context) {
    // Add selection popover item
    context.selectionPopover.add('quiz', ({ close, selectedText }) => (
      <button onClick={async () => {
        close();
        const response = await context.ai.ask(
          `Create 3 quizzes from this text: ${selectedText}`
        );
        context.modal.open(({ close }) => (
          <div>
            <h2>Quiz</h2>
            <pre>{response.content}</pre>
            <button onClick={close}>Close</button>
          </div>
        ));
      }}>
        🎯 Generate Quiz
      </button>
    ));
  },
};
```

### History Extension

Extension that adds a sidebar panel to view chat history:

```typescript
export const historyExtension: Extension = {
  id: 'history',
  name: 'Chat History',
  version: '0.1.0',

  async activate(context) {
    // Add sidebar panel
    context.sidebar.add('history-panel', {
      title: 'History',
      icon: '📜',
      content: ({ close, isOpen }) => {
        const [history, setHistory] = useState([]);

        useEffect(() => {
          if (isOpen) {
            // Load history when panel opens
            loadHistory().then(setHistory);
          }
        }, [isOpen]);

        return (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-4">Chat History</h2>
            <ul className="space-y-2">
              {history.map((item) => (
                <li key={item.id} className="p-2 border rounded">
                  {item.message}
                </li>
              ))}
            </ul>
          </div>
        );
      },
      options: {
        position: 'left',
        width: 320,
        defaultOpen: false,
      },
    });
  },

  deactivate() {
    // Cleanup if needed
  },
};
```

## Development Guide

### Extension Development Considerations

1. **Type Safety**: All APIs are typed with TypeScript
2. **Cleanup**: Clean up resources in `deactivate()`
3. **Error Handling**: Handle errors appropriately when calling APIs
4. **ID Uniqueness**: Extension IDs and popover item IDs must be unique

### Testing

```typescript
import { describe, it, expect } from 'vitest';
import { ExtensionLoader } from './ExtensionLoader';

describe('ExtensionLoader', () => {
  it('should load extension', async () => {
    const mockContext = createMockContext();
    const loader = new ExtensionLoader(mockContext);
    
    await loader.load('@allin/extension-quiz');
    
    expect(loader.list()).toHaveLength(1);
  });
});
```

## Roadmap

- [ ] Extension settings UI
- [ ] Extension marketplace
- [ ] Hot reload support
- [ ] Extension permission system
- [ ] Extension-to-extension communication API

## License

MIT
