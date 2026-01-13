# OpenBlock

A fully open-source, framework-agnostic rich text editor built on ProseMirror.

**All APIs are PUBLIC** - this is a core principle of OpenBlock.

## Why OpenBlock?

Unlike BlockNote or Tiptap, OpenBlock exposes all ProseMirror internals through a typed, documented API. No more `(editor as any).prosemirrorView` hacks.

```typescript
// OpenBlock way - clean, typed, documented
editor.pm.view        // EditorView
editor.pm.dispatch(tr) // Dispatch transaction
editor.pm.setNodeAttrs(pos, { width: 2 }) // Modify attributes

// Other editors - hacky, undocumented
(editor as any).prosemirrorView // 🚫
(editor as any)._tiptapEditor.view // 🚫
```

## Packages

| Package | Description |
|---------|-------------|
| [@openblock/core](packages/core) | Framework-agnostic editor core |
| [@openblock/react](packages/react) | React bindings |

## Quick Start

### React

```bash
pnpm add @openblock/core @openblock/react
```

```tsx
import { useOpenBlock, OpenBlockView } from '@openblock/react';
import '@openblock/core/styles/editor.css';

function MyEditor() {
  const editor = useOpenBlock({
    initialContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello!', styles: {} }] }
    ],
  });

  return <OpenBlockView editor={editor} />;
}
```

### Vanilla JS

```bash
pnpm add @openblock/core
```

```typescript
import { OpenBlockEditor } from '@openblock/core';
import '@openblock/core/styles/editor.css';

const editor = new OpenBlockEditor({
  element: document.getElementById('editor'),
});
```

## Key Features

- **Public ProseMirror API** - Full access via `editor.pm.*`
- **Block-based JSON format** - Similar to BlockNote/Notion
- **Framework-agnostic** - Core is vanilla JS, adapters for React (Vue, Svelte coming)
- **TypeScript first** - Full type safety
- **shadcn/ui compatible** - Styles use CSS variables

## Document Format

```typescript
interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content?: InlineContent[];
  children?: Block[];
}

// Example
const doc = [
  {
    id: 'abc123',
    type: 'heading',
    props: { level: 1 },
    content: [{ type: 'text', text: 'Title', styles: { bold: true } }],
  },
  {
    id: 'def456',
    type: 'paragraph',
    props: {},
    content: [{ type: 'text', text: 'Hello world', styles: {} }],
  },
];
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in watch mode
pnpm dev
```

## License

Apache-2.0
