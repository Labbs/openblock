import type { Block } from '@openblock/core';

/**
 * Sample document with all formatting options for testing.
 */
export const sampleDocument: Block[] = [
  {
    id: 'heading-1',
    type: 'heading',
    props: { level: 1 },
    content: [{ type: 'text', text: 'Welcome to OpenBlock', styles: {} }],
  },
  {
    id: 'para-intro',
    type: 'paragraph',
    props: {},
    content: [
      { type: 'text', text: 'OpenBlock is a ', styles: {} },
      { type: 'text', text: 'fully open-source', styles: { bold: true } },
      { type: 'text', text: ' rich text editor. All ProseMirror APIs are ', styles: {} },
      { type: 'text', text: 'public', styles: { bold: true, italic: true } },
      { type: 'text', text: '!', styles: {} },
    ],
  },
  {
    id: 'heading-formatting',
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Text Formatting', styles: {} }],
  },
  {
    id: 'para-formatting',
    type: 'paragraph',
    props: {},
    content: [
      { type: 'text', text: 'Bold', styles: { bold: true } },
      { type: 'text', text: ', ', styles: {} },
      { type: 'text', text: 'italic', styles: { italic: true } },
      { type: 'text', text: ', ', styles: {} },
      { type: 'text', text: 'underline', styles: { underline: true } },
      { type: 'text', text: ', ', styles: {} },
      { type: 'text', text: 'strikethrough', styles: { strikethrough: true } },
      { type: 'text', text: ', and ', styles: {} },
      { type: 'text', text: 'inline code', styles: { code: true } },
      { type: 'text', text: '.', styles: {} },
    ],
  },
  {
    id: 'para-combined',
    type: 'paragraph',
    props: {},
    content: [
      { type: 'text', text: 'Combined: ', styles: {} },
      { type: 'text', text: 'bold+italic', styles: { bold: true, italic: true } },
      { type: 'text', text: ', ', styles: {} },
      { type: 'text', text: 'bold+underline', styles: { bold: true, underline: true } },
      { type: 'text', text: ', ', styles: {} },
      { type: 'text', text: 'all styles', styles: { bold: true, italic: true, underline: true } },
      { type: 'text', text: '.', styles: {} },
    ],
  },
  {
    id: 'heading-levels',
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Heading Levels', styles: {} }],
  },
  {
    id: 'heading-h3',
    type: 'heading',
    props: { level: 3 },
    content: [{ type: 'text', text: 'Heading 3', styles: {} }],
  },
  {
    id: 'heading-h4',
    type: 'heading',
    props: { level: 4 },
    content: [{ type: 'text', text: 'Heading 4', styles: {} }],
  },
  {
    id: 'heading-h5',
    type: 'heading',
    props: { level: 5 },
    content: [{ type: 'text', text: 'Heading 5', styles: {} }],
  },
  {
    id: 'heading-h6',
    type: 'heading',
    props: { level: 6 },
    content: [{ type: 'text', text: 'Heading 6', styles: {} }],
  },
  {
    id: 'heading-blocks',
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Block Types', styles: {} }],
  },
  {
    id: 'blockquote-1',
    type: 'blockquote',
    props: {},
    content: [
      { type: 'text', text: 'This is a blockquote. It can contain ', styles: {} },
      { type: 'text', text: 'formatted text', styles: { italic: true } },
      { type: 'text', text: ' too.', styles: {} },
    ],
  },
  {
    id: 'para-code-intro',
    type: 'paragraph',
    props: {},
    content: [{ type: 'text', text: 'Code blocks preserve formatting:', styles: {} }],
  },
  {
    id: 'codeblock-1',
    type: 'codeBlock',
    props: { language: 'typescript' },
    content: [{ type: 'text', text: 'const editor = new OpenBlockEditor();\neditor.pm.view; // EditorView\neditor.pm.state; // EditorState', styles: {} }],
  },
  {
    id: 'divider-1',
    type: 'divider',
    props: {},
  },
  {
    id: 'heading-lists',
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Lists', styles: {} }],
  },
  {
    id: 'para-bullet-intro',
    type: 'paragraph',
    props: {},
    content: [{ type: 'text', text: 'Bullet list:', styles: {} }],
  },
  {
    id: 'bullet-list-1',
    type: 'bulletList',
    props: {},
    children: [
      { id: 'bullet-item-1', type: 'listItem', props: {}, content: [{ type: 'text', text: 'First item', styles: {} }] },
      { id: 'bullet-item-2', type: 'listItem', props: {}, content: [{ type: 'text', text: 'Second item with ', styles: {} }, { type: 'text', text: 'bold', styles: { bold: true } }] },
      { id: 'bullet-item-3', type: 'listItem', props: {}, content: [{ type: 'text', text: 'Third item', styles: {} }] },
    ],
  },
  {
    id: 'para-ordered-intro',
    type: 'paragraph',
    props: {},
    content: [{ type: 'text', text: 'Ordered list:', styles: {} }],
  },
  {
    id: 'ordered-list-1',
    type: 'orderedList',
    props: { start: 1 },
    children: [
      { id: 'ordered-item-1', type: 'listItem', props: {}, content: [{ type: 'text', text: 'Step one', styles: {} }] },
      { id: 'ordered-item-2', type: 'listItem', props: {}, content: [{ type: 'text', text: 'Step two', styles: {} }] },
      { id: 'ordered-item-3', type: 'listItem', props: {}, content: [{ type: 'text', text: 'Step three', styles: {} }] },
    ],
  },
  {
    id: 'divider-2',
    type: 'divider',
    props: {},
  },
  {
    id: 'heading-columns',
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Multi-Column Layout', styles: {} }],
  },
  {
    id: 'para-columns-intro',
    type: 'paragraph',
    props: {},
    content: [{ type: 'text', text: 'Drag the separator between columns to resize:', styles: {} }],
  },
  {
    id: 'column-list-1',
    type: 'columnList',
    props: { gap: 16 },
    children: [
      {
        id: 'column-1',
        type: 'column',
        props: { width: 50 },
        children: [
          {
            id: 'col1-heading',
            type: 'heading',
            props: { level: 3 },
            content: [{ type: 'text', text: 'Left Column', styles: {} }],
          },
          {
            id: 'col1-para',
            type: 'paragraph',
            props: {},
            content: [
              { type: 'text', text: 'This is the ', styles: {} },
              { type: 'text', text: 'left', styles: { bold: true } },
              { type: 'text', text: ' column. You can add any blocks here.', styles: {} },
            ],
          },
          {
            id: 'col1-list',
            type: 'bulletList',
            props: {},
            children: [
              { id: 'col1-item-1', type: 'listItem', props: {}, content: [{ type: 'text', text: 'Item one', styles: {} }] },
              { id: 'col1-item-2', type: 'listItem', props: {}, content: [{ type: 'text', text: 'Item two', styles: {} }] },
            ],
          },
        ],
      },
      {
        id: 'column-2',
        type: 'column',
        props: { width: 50 },
        children: [
          {
            id: 'col2-heading',
            type: 'heading',
            props: { level: 3 },
            content: [{ type: 'text', text: 'Right Column', styles: {} }],
          },
          {
            id: 'col2-para',
            type: 'paragraph',
            props: {},
            content: [
              { type: 'text', text: 'This is the ', styles: {} },
              { type: 'text', text: 'right', styles: { bold: true } },
              { type: 'text', text: ' column. Resize by dragging the separator!', styles: {} },
            ],
          },
          {
            id: 'col2-quote',
            type: 'blockquote',
            props: {},
            content: [{ type: 'text', text: 'Columns can contain any block type.', styles: { italic: true } }],
          },
        ],
      },
    ],
  },
  {
    id: 'divider-3',
    type: 'divider',
    props: {},
  },
  {
    id: 'heading-api',
    type: 'heading',
    props: { level: 2 },
    content: [{ type: 'text', text: 'Public API', styles: {} }],
  },
  {
    id: 'para-api',
    type: 'paragraph',
    props: {},
    content: [
      { type: 'text', text: 'Access ProseMirror via ', styles: {} },
      { type: 'text', text: 'editor.pm', styles: { code: true } },
      { type: 'text', text: ':', styles: {} },
    ],
  },
  {
    id: 'api-list',
    type: 'bulletList',
    props: {},
    children: [
      { id: 'api-item-1', type: 'listItem', props: {}, content: [{ type: 'text', text: 'editor.pm.view', styles: { code: true } }, { type: 'text', text: ' → EditorView', styles: {} }] },
      { id: 'api-item-2', type: 'listItem', props: {}, content: [{ type: 'text', text: 'editor.pm.state', styles: { code: true } }, { type: 'text', text: ' → EditorState', styles: {} }] },
      { id: 'api-item-3', type: 'listItem', props: {}, content: [{ type: 'text', text: 'editor.pm.dispatch(tr)', styles: { code: true } }, { type: 'text', text: ' → dispatch transaction', styles: {} }] },
    ],
  },
  {
    id: 'para-final',
    type: 'paragraph',
    props: {},
    content: [
      { type: 'text', text: 'Try editing this document!', styles: { bold: true } },
      { type: 'text', text: ' Use Cmd+B for bold, Cmd+I for italic, Cmd+U for underline.', styles: {} },
    ],
  },
];
