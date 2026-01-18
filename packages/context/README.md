# @allin/context

Extension context interface package for ALLIN.

## Overview

This package defines the `ExtensionContext` interface that extensions use to interact with the ALLIN app.

## ExtensionContext

```typescript
interface ExtensionContext {
  ai: AI;                                    // AI interaction
  modal: Modal;                              // Modal management
  sidebar: Sidebar;                          // Sidebar panel control
  TextSelectionFloatingButtonList: TextSelectionFloatingButtonList;  // Text selection popover
  aui: AUI;                                  // UI components
  event: Event;                              // Event system
}
```

## APIs

### AI

```typescript
const response = await context.ai.ask('Hello', {
  systemPrompt: 'You are helpful assistant',
  schema: myZodSchema,  // optional structured output
});
```

### Modal

```typescript
context.modal.open(
  ({ close }) => <MyModal onClose={close} />,
  { size: 'lg', closeOnBackdropClick: true }
);
```

### Sidebar

```typescript
context.sidebar.add('my-panel', {
  title: 'My Panel',
  icon: <MyIcon />,
  view: ({ close, isOpen }) => <MyPanel />,
  options: { position: 'left', width: 300 }
});
```

### TextSelectionFloatingButtonList

```typescript
context.TextSelectionFloatingButtonList.add('my-button', ({ close, selectedText }) => (
  <button onClick={() => handleClick(selectedText)}>Action</button>
));
```

## Architecture

```
Extension ──uses──> ExtensionContext (interface)
                          ↑
                    implements
                          │
                    App (runtime)
```

Extensions depend only on this interface package. The app provides the actual implementation at runtime.
