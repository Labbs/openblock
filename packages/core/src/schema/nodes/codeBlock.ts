/**
 * Code block node specification.
 *
 * A block for displaying preformatted code with optional language hint.
 *
 * @module
 */

import type { NodeSpec, DOMOutputSpec, Node as PMNode } from 'prosemirror-model';

import { blockIdAttr, getBlockIdAttrs, blockIdToDOM } from '../blockIdAttrs';

/**
 * Code block node spec.
 *
 * Renders as `<pre><code>` elements. The `language` prop can be used
 * for syntax highlighting integration.
 *
 * Note: Code blocks contain plain text only - marks are not applied inside.
 *
 * @example
 * ```typescript
 * // JSON block representation:
 * {
 *   id: 'code-1',
 *   type: 'codeBlock',
 *   props: { language: 'typescript' },
 *   content: [{ type: 'text', text: 'const x = 42;', styles: {} }]
 * }
 * ```
 */
export const codeBlockNode: NodeSpec = {
  content: 'text*',
  group: 'block',
  // Code blocks don't allow marks - code is plain text
  marks: '',
  // Mark this node as code (affects e.g. cursor behavior and input rules)
  code: true,
  // Keep this node as the boundary when its content is replaced
  defining: true,
  attrs: {
    ...blockIdAttr(),
    language: { default: '' },
  },
  parseDOM: [
    {
      tag: 'pre',
      // Preserve whitespace exactly as written
      preserveWhitespace: 'full',
      getAttrs(node) {
        const pre = node as HTMLElement;
        const code = pre.querySelector('code');
        const lang = code?.getAttribute('data-language') || code?.className.match(/language-(\w+)/)?.[1] || '';
        return { ...getBlockIdAttrs(pre), language: lang };
      },
    },
  ],
  toDOM(node: PMNode): DOMOutputSpec {
    const language = node.attrs.language || '';
    const codeAttrs: Record<string, string> = language
      ? { 'data-language': language, class: `language-${language}` }
      : {};
    return [
      'pre',
      { class: 'openblock-code-block', ...blockIdToDOM(node) },
      ['code', codeAttrs, 0],
    ];
  },
};
