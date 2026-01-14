<p align="center">
  <h1 align="center">OpenBlock</h1>
  <p align="center">
    A fully open-source block editor with public ProseMirror API
  </p>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api">API</a> •
  <a href="#documentation">Docs</a> •
  <a href="https://labbs.github.io/openblock/">Live Demo</a>
</p>

---

## Why OpenBlock?

Unlike other editors (BlockNote, Tiptap), **OpenBlock exposes all ProseMirror internals** through a typed, documented API. No more hacks.

```typescript
// ✅ OpenBlock - clean, typed, documented
editor.pm.view           // EditorView
editor.pm.state          // EditorState
editor.pm.dispatch(tr)   // Dispatch transactions
editor.pm.setNodeAttrs(pos, attrs)

// ❌ Other editors - hacky, undocumented
(editor as any).prosemirrorView
(editor as any)._tiptapEditor.view
```

## Features

- **Public ProseMirror API** — Full access via `editor.pm.*`
- **Block-based JSON** — Notion-like format, easy to store and transform
- **Framework-agnostic** — Vanilla JS core with React bindings (Vue, Svelte coming)
- **TypeScript first** — Full type safety throughout
- **Rich block types** — Headings, lists, code blocks, columns, and more
- **Built-in UI** — Slash menu, bubble menu, drag & drop

## Quick Start

### Installation

```bash
npm install @openblock/core @openblock/react
```

### React

```tsx
import { useOpenBlock, OpenBlockView, SlashMenu, BubbleMenu } from '@openblock/react';
import '@openblock/core/styles/editor.css';

function Editor() {
  const editor = useOpenBlock({
    initialContent: [
      {
        id: '1',
        type: 'paragraph',
        props: {},
        content: [{ type: 'text', text: 'Hello, World!', styles: {} }]
      }
    ],
  });

  return (
    <>
      <OpenBlockView editor={editor} />
      <SlashMenu editor={editor} />
      <BubbleMenu editor={editor} />
    </>
  );
}
```

### Vanilla JS

```typescript
import { OpenBlockEditor } from '@openblock/core';
import '@openblock/core/styles/editor.css';

const editor = new OpenBlockEditor({
  initialContent: [/* blocks */],
});

editor.mount(document.getElementById('editor'));
```

## API

### Document Operations

```typescript
editor.getDocument()                    // Get all blocks
editor.setDocument(blocks)              // Replace document
editor.getBlock(id)                     // Find block by ID
editor.insertBlocks(blocks, ref, pos)   // Insert blocks
editor.updateBlock(id, update)          // Update block
editor.removeBlocks(ids)                // Delete blocks
```

### Text Formatting

```typescript
editor.toggleBold()
editor.toggleItalic()
editor.toggleUnderline()
editor.toggleStrikethrough()
editor.toggleCode()
editor.setTextColor(color)
editor.setBackgroundColor(color)
```

### Block Types

```typescript
editor.setBlockType('heading', { level: 1 })
editor.setBlockType('codeBlock', { language: 'typescript' })
editor.setBlockType('bulletList')
editor.setBlockType('orderedList')
editor.setBlockType('blockquote')
```

### ProseMirror Access

```typescript
editor.pm.view              // EditorView
editor.pm.state             // EditorState
editor.pm.doc               // Document
editor.pm.dispatch(tr)      // Dispatch transaction
editor.pm.setNodeAttrs(pos, attrs)
```

## Block Format

```typescript
interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
  content?: InlineContent[];
  children?: Block[];
}

// Example document
const blocks = [
  {
    id: 'heading-1',
    type: 'heading',
    props: { level: 1 },
    content: [{ type: 'text', text: 'Welcome', styles: { bold: true } }]
  },
  {
    id: 'para-1',
    type: 'paragraph',
    props: {},
    content: [{ type: 'text', text: 'Hello world', styles: {} }]
  }
];
```

## Packages

| Package | Description |
|---------|-------------|
| [@openblock/core](packages/core) | Framework-agnostic editor core |
| [@openblock/react](packages/react) | React bindings and components |

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run example in dev mode
pnpm dev
```

## License

[Apache-2.0](LICENSE)
