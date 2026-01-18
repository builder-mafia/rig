# @allin/extension

Extension type definition package for ALLIN.

## Overview

This package provides the `Extension` type definition that all ALLIN extensions must implement.

## Usage

```typescript
import type { Extension } from '@allin/extension';
import type { ExtensionContext } from '@allin/context';

const myExtension: Extension = (context: ExtensionContext) => ({
  id: 'my-extension',
  name: 'My Extension',
  version: '1.0.0',
  description: 'A custom extension for ALLIN',
});

export default myExtension;
```

## Extension Type

```typescript
type Extension = (context: ExtensionContext) => {
  id: string;          // Unique extension identifier
  name: string;        // Display name
  version: string;     // Semver version
  description?: string; // Optional description
};
```

## ExtensionContext

The `context` parameter provides access to ALLIN APIs:

- `ai` - AI interaction
- `modal` - Modal management
- `sidebar` - Sidebar panel control
- `TextSelectionFloatingButtonList` - Text selection popover
- `aui` - UI components
- `event` - Event system

See `@allin/context` for detailed API documentation.
