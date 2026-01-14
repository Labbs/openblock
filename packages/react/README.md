# @labbs/openblock-react

React bindings for the OpenBlock rich text editor.

## Installation

```bash
npm install @labbs/openblock-react @labbs/openblock-core
# or
pnpm add @labbs/openblock-react @labbs/openblock-core
```

## Quick Start

```tsx
import { useOpenBlock, OpenBlockView } from '@labbs/openblock-react';
import '@labbs/openblock-core/styles/editor.css';

function MyEditor() {
  const editor = useOpenBlock({
    initialContent: [
      {
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: 'Hello World', styles: {} }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Start editing...', styles: {} }],
      },
    ],
  });

  return <OpenBlockView editor={editor} />;
}
```

## Hooks

### useOpenBlock

Creates and manages an OpenBlockEditor instance.

```tsx
const editor = useOpenBlock({
  initialContent: [...],
  editable: true,
  autoFocus: 'end',
  onUpdate: (blocks) => console.log(blocks),
  deps: [someValue], // Recreate editor when deps change
});
```

### useEditorContent

Subscribe to document changes.

```tsx
const blocks = useEditorContent(editor);
// blocks updates whenever the document changes
```

### useEditorSelection

Subscribe to selection changes.

```tsx
const selectedBlocks = useEditorSelection(editor);
// selectedBlocks updates when selection changes
```

### useEditorFocus

Track editor focus state.

```tsx
const isFocused = useEditorFocus(editor);
```

## Components

### OpenBlockView

Renders the editor view.

```tsx
<OpenBlockView
  editor={editor}
  className="my-editor"
/>
```

With ref for imperative access:

```tsx
const viewRef = useRef<OpenBlockViewRef>(null);

<OpenBlockView
  ref={viewRef}
  editor={editor}
/>

// Later: viewRef.current?.focus()
```

## Accessing ProseMirror

The editor instance provides full ProseMirror access:

```tsx
function MyEditor() {
  const editor = useOpenBlock({...});

  const handleBold = () => {
    editor.toggleBold();
  };

  const handleCustomAction = () => {
    // Direct ProseMirror access
    const tr = editor.pm.createTransaction();
    tr.insertText('Custom text');
    editor.pm.dispatch(tr);
  };

  return (
    <>
      <button onClick={handleBold}>Bold</button>
      <button onClick={handleCustomAction}>Insert</button>
      <OpenBlockView editor={editor} />
    </>
  );
}
```

## License

Apache-2.0
