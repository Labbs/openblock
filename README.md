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
- **Rich block types** — Headings, lists, code blocks, tables, columns, and more
- **Built-in UI** — Slash menu, bubble menu, drag & drop, table handles

## Quick Start

### Installation

First, configure npm to use GitHub Packages for the `@labbs` scope. Create or edit `.npmrc` in your project:

```
@labbs:registry=https://npm.pkg.github.com
```

Then install the packages:

```bash
npm install @labbs/openblock-core @labbs/openblock-react
```

### React

```tsx
import { useOpenBlock, OpenBlockView, SlashMenu, BubbleMenu, TableHandles } from '@labbs/openblock-react';
import '@labbs/openblock-core/styles/editor.css';

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
      <TableHandles editor={editor} />
    </>
  );
}
```

### Vanilla JS

```typescript
import { OpenBlockEditor } from '@labbs/openblock-core';
import '@labbs/openblock-core/styles/editor.css';

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
editor.setBlockType('table')
```

### Table Commands

```typescript
import {
  addRowAfter,
  addRowBefore,
  deleteRow,
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  goToNextCell,
  goToPreviousCell,
  isInTable
} from '@labbs/openblock-core';

// Check if cursor is in a table
if (isInTable(editor.pm.state)) {
  // Add row after current row
  addRowAfter(editor.pm.state, editor.pm.view.dispatch);

  // Add column before current column
  addColumnBefore(editor.pm.state, editor.pm.view.dispatch);

  // Delete current row
  deleteRow(editor.pm.state, editor.pm.view.dispatch);
}

// Navigate between cells (Tab / Shift+Tab)
goToNextCell(editor.pm.state, editor.pm.view.dispatch);
goToPreviousCell(editor.pm.state, editor.pm.view.dispatch);
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
  },
  {
    id: 'table-1',
    type: 'table',
    props: {},
    children: [
      {
        id: 'row-1',
        type: 'tableRow',
        props: {},
        children: [
          { id: 'header-1', type: 'tableHeader', props: {}, content: [{ type: 'text', text: 'Name', styles: {} }] },
          { id: 'header-2', type: 'tableHeader', props: {}, content: [{ type: 'text', text: 'Value', styles: {} }] }
        ]
      },
      {
        id: 'row-2',
        type: 'tableRow',
        props: {},
        children: [
          { id: 'cell-1', type: 'tableCell', props: {}, content: [{ type: 'text', text: 'Item', styles: {} }] },
          { id: 'cell-2', type: 'tableCell', props: {}, content: [{ type: 'text', text: '100', styles: {} }] }
        ]
      }
    ]
  }
];
```

## React Components

### OpenBlockView
The main editor component that renders the ProseMirror view.

### SlashMenu
Displays a command palette when typing `/` to insert blocks.

### BubbleMenu
Floating toolbar that appears when selecting text for formatting.

### TableHandles
Renders handles on tables for adding/removing rows and columns.

```tsx
import { TableHandles } from '@labbs/openblock-react';

// Add to your editor
<TableHandles editor={editor} />
```

When hovering over a table:
- **Row handles** appear on the left — click to insert/delete rows
- **Column handles** appear on top — click to insert/delete columns
- **Extend buttons** appear on the right and bottom — click to add rows/columns

## Packages

| Package | Description |
|---------|-------------|
| [@labbs/openblock-core](packages/core) | Framework-agnostic editor core |
| [@labbs/openblock-react](packages/react) | React bindings and components |

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
