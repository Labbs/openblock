# Creating Custom Blocks in OpenBlock

This guide explains how to create custom block types for the OpenBlock editor.

## Overview

OpenBlock is built on ProseMirror and uses a block-based document model. Each block type is defined by:

1. **Node Spec** - ProseMirror schema definition
2. **Block Converter** - Converts between Block format and ProseMirror nodes
3. **CSS Styles** - Visual styling for the block
4. **Slash Menu Item** (optional) - Entry in the `/` command menu

## Quick Example: Creating a "Note" Block

Let's create a simple note block with a title and content.

### Step 1: Define the Node Spec

Create a file `noteNode.ts`:

```typescript
import type { NodeSpec } from 'prosemirror-model';

export type NoteType = 'tip' | 'warning' | 'important';

export const noteNode: NodeSpec = {
  // Content model: what can go inside this block
  content: 'inline*',  // Allow inline content (text, marks)

  // Block group: makes it a top-level block
  group: 'block',

  // Attributes: custom properties for this block
  attrs: {
    id: { default: null },           // Required: unique block ID
    noteType: { default: 'tip' as NoteType },
    title: { default: '' },
  },

  // How to parse from HTML (for copy/paste)
  parseDOM: [
    {
      tag: 'div.custom-note',
      getAttrs: (dom) => {
        const element = dom as HTMLElement;
        return {
          id: element.getAttribute('data-block-id'),
          noteType: element.getAttribute('data-note-type') || 'tip',
          title: element.getAttribute('data-title') || '',
        };
      },
    },
  ],

  // How to render to HTML
  toDOM: (node) => {
    return [
      'div',
      {
        class: `custom-note custom-note--${node.attrs.noteType}`,
        'data-block-id': node.attrs.id,
        'data-note-type': node.attrs.noteType,
        'data-title': node.attrs.title,
      },
      // 0 means "render content here"
      0,
    ];
  },
};
```

### Step 2: Add to Schema

Modify `createSchema.ts` to include your block:

```typescript
import { noteNode } from './nodes/noteNode';

export const DEFAULT_NODES = {
  // ... existing nodes
  note: noteNode,
};
```

### Step 3: Update Block Converters

Add conversion logic in `blocks/blockToNode.ts`:

```typescript
case 'note':
  return schema.nodes.note.create(
    {
      id: block.id,
      noteType: block.props?.noteType || 'tip',
      title: block.props?.title || '',
    },
    convertInlineContent(schema, block.content)
  );
```

And in `blocks/nodeToBlock.ts`:

```typescript
case 'note':
  return {
    id: node.attrs.id || generateId(),
    type: 'note',
    props: {
      noteType: node.attrs.noteType,
      title: node.attrs.title,
    },
    content: extractInlineContent(node),
  };
```

### Step 4: Add CSS Styles

Add styles to `editor.css`:

```css
/* Note Block */
.openblock-editor .custom-note {
  margin: 0;
  padding: 1em;
  border-radius: var(--ob-radius);
  border-left: 4px solid;
}

.openblock-editor .custom-note--tip {
  border-left-color: hsl(142 76% 36%);
  background: hsl(142 76% 36% / 0.1);
}

.openblock-editor .custom-note--warning {
  border-left-color: hsl(38 92% 50%);
  background: hsl(38 92% 50% / 0.1);
}

.openblock-editor .custom-note--important {
  border-left-color: hsl(0 84% 60%);
  background: hsl(0 84% 60% / 0.1);
}
```

### Step 5: Add to Slash Menu (Optional)

In `plugins/slashMenuPlugin.ts`, add menu items:

```typescript
{
  id: 'note-tip',
  title: 'Tip',
  description: 'Add a tip note',
  icon: `<svg>...</svg>`,
  action: (view) => {
    insertBlock(view, 'note', { noteType: 'tip' });
  },
},
```

## Block Types Reference

### Content Models

| Model | Description | Example |
|-------|-------------|---------|
| `inline*` | Zero or more inline nodes | Paragraph, Heading |
| `block+` | One or more block nodes | List items, Columns |
| `text*` | Plain text only | Code block |
| `(paragraph \| heading)+` | Specific blocks | Custom container |

### Common Attributes

Every block should have an `id` attribute:

```typescript
attrs: {
  id: { default: null },  // Always include this
  // ... your custom attrs
},
```

### Group Types

| Group | Description |
|-------|-------------|
| `block` | Top-level block that can appear in document |
| `inline` | Inline element (text, links) |

## Advanced: Nested Blocks

For blocks that contain other blocks (like columns or lists):

```typescript
export const containerNode: NodeSpec = {
  // Contains other blocks
  content: 'block+',
  group: 'block',
  attrs: {
    id: { default: null },
  },
  toDOM: () => ['div', { class: 'custom-container' }, 0],
};
```

## Advanced: Custom Node Views

For complex interactive blocks, use ProseMirror NodeViews:

```typescript
const editor = new OpenBlockEditor({
  prosemirror: {
    nodeViews: {
      note: (node, view, getPos) => {
        // Return a custom NodeView implementation
        const dom = document.createElement('div');
        dom.className = 'custom-note-view';

        // Add interactive elements
        const titleInput = document.createElement('input');
        titleInput.value = node.attrs.title;
        titleInput.onchange = () => {
          const pos = getPos();
          if (typeof pos === 'number') {
            view.dispatch(
              view.state.tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                title: titleInput.value,
              })
            );
          }
        };

        dom.appendChild(titleInput);

        const contentDOM = document.createElement('div');
        dom.appendChild(contentDOM);

        return {
          dom,
          contentDOM,
          update: (updatedNode) => {
            if (updatedNode.type.name !== 'note') return false;
            titleInput.value = updatedNode.attrs.title;
            return true;
          },
        };
      },
    },
  },
});
```

## Using Custom Blocks

Once registered, use blocks in your document:

```typescript
const editor = new OpenBlockEditor({
  initialContent: [
    {
      id: 'note-1',
      type: 'note',
      props: {
        noteType: 'tip',
        title: 'Pro Tip',
      },
      content: [
        { type: 'text', text: 'This is a helpful tip!', styles: {} },
      ],
    },
  ],
});
```

## Existing Block Types

OpenBlock includes these built-in blocks:

| Type | Description | Props |
|------|-------------|-------|
| `paragraph` | Basic text block | `textAlign` |
| `heading` | Heading (h1-h6) | `level`, `textAlign` |
| `bulletList` | Bullet list | - |
| `orderedList` | Numbered list | - |
| `listItem` | List item | - |
| `blockquote` | Quote block | - |
| `callout` | Callout box | `calloutType` (info, warning, success, error, note) |
| `codeBlock` | Code block | `language` |
| `divider` | Horizontal rule | - |
| `table` | Table | - |
| `columnList` | Multi-column layout | - |
| `column` | Column in layout | `width` |

## Tips

1. **Always test with copy/paste** - Ensure `parseDOM` handles pasted content correctly
2. **Use semantic HTML** - Helps with accessibility and SEO
3. **Keep blocks simple** - Complex UI should use NodeViews
4. **Export types** - Export your block types from `index.ts` for consumers
5. **Update injectStyles.ts** - If using auto-injection, add your CSS to the embedded styles

## Full Example: Callout Block

See the built-in callout implementation:
- Node spec: `packages/core/src/schema/nodes/callout.ts`
- Styles: `packages/core/src/styles/editor.css` (search for `.openblock-callout`)
- Slash menu: `packages/core/src/plugins/slashMenuPlugin.ts`
