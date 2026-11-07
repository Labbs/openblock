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

Each [GitHub Release](https://github.com/Labbs/openblock/releases) provides three ways to get OpenBlock:

#### 1. From GitHub Packages (npm registry)

GitHub Packages requires authentication, even for public packages. Create a
[personal access token](https://github.com/settings/tokens) with the `read:packages` scope, then add to your project's `.npmrc`:

```
@labbs:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm install @labbs/openblock-core @labbs/openblock-react
```

#### 2. From the Release tarballs (no registry, no token)

The npm packages are attached to every release and can be installed directly from their URL:

```bash
VERSION=1.0.0
npm install \
  https://github.com/Labbs/openblock/releases/download/v$VERSION/labbs-openblock-core-$VERSION.tgz \
  https://github.com/Labbs/openblock/releases/download/v$VERSION/labbs-openblock-react-$VERSION.tgz
```

Install both tarballs in the same command: `@labbs/openblock-react` depends on the exact same version of `@labbs/openblock-core`.

#### 3. Standalone browser bundles (no build step)

Each release also ships self-contained, minified builds. Download them and serve them with your app
(GitHub release downloads cannot be hot-linked from a `<script>` tag):

| File | Contents |
| --- | --- |
| `openblock-core.iife.js` | Core + ProseMirror, classic `<script>`, exposes `window.OpenBlock` |
| `openblock-core.esm.js` | Core + ProseMirror, ES module |
| `openblock-react.esm.js` | React bindings, ES module (imports `react` and `@labbs/openblock-core`) |
| `openblock.css` | Editor styles (only needed with `injectStyles: false`) |
| `SHA256SUMS.txt` | Checksums of all assets |

```html
<div id="editor"></div>
<script src="/vendor/openblock-core.iife.js"></script>
<script>
  const editor = new OpenBlock.OpenBlockEditor({
    element: document.getElementById('editor'),
  });
</script>
```

ES modules work the same way (`import { OpenBlockEditor } from '/vendor/openblock-core.esm.js'`).
For React without a bundler, resolve the bare imports with an import map. Map `@labbs/openblock-core` to the
core bundle so the page only loads one copy of ProseMirror:

```html
<script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19",
      "react/jsx-runtime": "https://esm.sh/react@19/jsx-runtime",
      "react-dom/client": "https://esm.sh/react-dom@19/client",
      "@labbs/openblock-core": "/vendor/openblock-core.esm.js"
    }
  }
</script>
<script type="module">
  import { useOpenBlock, OpenBlockView } from '/vendor/openblock-react.esm.js';
</script>
```

When installed from npm, the same files are available as `@labbs/openblock-core/standalone`,
`@labbs/openblock-core/standalone/iife` and `@labbs/openblock-react/standalone`.

The npm packages ship ESM and CommonJS builds (`import` and `require` both work) with bundled TypeScript declarations.

### React

```tsx
import { useOpenBlock, OpenBlockView, SlashMenu, BubbleMenu, TableHandles } from '@labbs/openblock-react';
// CSS is auto-injected by default - no import needed!

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
// CSS is auto-injected by default - no import needed!

const editor = new OpenBlockEditor({
  initialContent: [/* blocks */],
});

editor.mount(document.getElementById('editor'));
```

> **Note:** CSS styles are automatically injected into the document head. To disable auto-injection and provide your own styles, set `injectStyles: false` in the editor config.

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

## Custom Blocks

Create custom React blocks with `createReactBlockSpec`:

```tsx
import { createReactBlockSpec, useOpenBlock, SlashMenu, useCustomSlashMenuItems } from '@labbs/openblock-react';

// Define a custom block
const AlertBlock = createReactBlockSpec(
  {
    type: 'alert',
    propSchema: {
      alertType: { default: 'info' },
      message: { default: '' },
    },
    content: 'none',
  },
  {
    render: ({ block }) => (
      <div className={`alert alert-${block.props.alertType}`}>
        {block.props.message}
      </div>
    ),
    slashMenu: {
      title: 'Alert',
      description: 'Insert an alert box',
      aliases: ['warning', 'info'],
      group: 'Basic',
    },
  }
);

// Use custom blocks
const CUSTOM_BLOCKS = [AlertBlock];

function Editor() {
  const editor = useOpenBlock({ customBlocks: CUSTOM_BLOCKS });
  const customItems = useCustomSlashMenuItems(editor, CUSTOM_BLOCKS);

  return (
    <>
      <OpenBlockView editor={editor} />
      <SlashMenu editor={editor} additionalItems={customItems} />
    </>
  );
}
```

See [Custom Blocks Guide](docs/custom-blocks.md) for more details.

## Documentation

| Guide | Description |
|-------|-------------|
| [React Integration](docs/react-integration.md) | Hooks, components, and patterns for React |
| [Custom Blocks](docs/custom-blocks.md) | Creating your own block types |
| [Custom Marks](docs/custom-marks.md) | Creating inline formatting marks |
| [Plugins](docs/plugins.md) | Building ProseMirror plugins |
| [Styling](docs/styling.md) | CSS customization and theming |

## Packages

| Package | Description |
|---------|-------------|
| [@labbs/openblock-core](packages/core) | Framework-agnostic editor core |
| [@labbs/openblock-react](packages/react) | React bindings and components |

## Development

Requires Node.js >= 20.19 and pnpm 10 (the exact version is pinned in `package.json` → `corepack enable` picks it up).

```bash
# Install dependencies
pnpm install

# Build all packages (ESM + CJS + standalone bundles)
pnpm build

# Lint and type-check
pnpm lint
pnpm typecheck

# Run example in dev mode
pnpm dev
```

### Releasing

Publishing a GitHub Release with a `vX.Y.Z` tag (or `vX.Y.Z-beta.1` for a pre-release, published under the `next` dist-tag) triggers
`.github/workflows/publish.yml`. It publishes both packages to GitHub Packages and attaches the tarballs,
standalone bundles, CSS and checksums to the release.

## License

[Apache-2.0](LICENSE)
