/**
 * Block to ProseMirror node conversion.
 *
 * @module
 */

import { Schema, Node as PMNode, Mark } from 'prosemirror-model';
import { v4 as uuid } from 'uuid';

import type { Block, InlineContent, TextStyles } from './types';

/**
 * Converts a Block to a ProseMirror node.
 *
 * This is the core transformation that takes our JSON block format
 * and produces the corresponding ProseMirror document structure.
 *
 * Handles both simple blocks (paragraph, heading) and container blocks
 * (lists, columns) that have nested children.
 *
 * @example
 * ```typescript
 * const block: Block = {
 *   id: 'abc',
 *   type: 'paragraph',
 *   props: {},
 *   content: [{ type: 'text', text: 'Hello', styles: { bold: true } }]
 * };
 *
 * const node = blockToNode(schema, block);
 * ```
 *
 * @param schema - The ProseMirror schema
 * @param block - The block to convert
 * @returns A ProseMirror Node
 */
export function blockToNode(schema: Schema, block: Block): PMNode {
  const nodeType = schema.nodes[block.type];

  if (!nodeType) {
    // Fallback to paragraph for unknown block types
    console.warn(`Unknown block type: ${block.type}, falling back to paragraph`);
    return schema.node('paragraph', { id: block.id || uuid() });
  }

  const attrs = {
    id: block.id || uuid(),
    ...block.props,
  };

  // Handle container blocks with children (lists, columns, etc.)
  if (block.children && block.children.length > 0) {
    const childNodes = block.children.map((child) => blockToNode(schema, child));
    return nodeType.create(attrs, childNodes);
  }

  // Handle list items specially - they need a paragraph wrapper for inline content
  if (block.type === 'listItem' && block.content) {
    const paragraph = schema.node('paragraph', null, inlineContentToNodes(schema, block.content));
    return nodeType.create(attrs, [paragraph]);
  }

  // Handle leaf blocks with no content (divider)
  if (!block.content || block.content.length === 0) {
    // Check if node type allows empty content
    if (nodeType.spec.content === '' || nodeType.spec.content === undefined) {
      return nodeType.create(attrs);
    }
    // Otherwise create with empty inline content
    return nodeType.create(attrs, []);
  }

  // Standard blocks with inline content
  const content = inlineContentToNodes(schema, block.content);
  return nodeType.create(attrs, content);
}

/**
 * Converts inline content to ProseMirror text nodes.
 *
 * @param schema - The ProseMirror schema
 * @param content - Array of inline content items
 * @returns Array of ProseMirror nodes
 */
export function inlineContentToNodes(schema: Schema, content: InlineContent[]): PMNode[] {
  return content.map((item) => {
    if (item.type === 'text') {
      const marks = stylesToMarks(schema, item.styles);
      return schema.text(item.text, marks);
    }

    // Future: Handle link content and other inline types
    return schema.text('');
  });
}

/**
 * Converts text styles to ProseMirror marks.
 *
 * @param schema - The ProseMirror schema
 * @param styles - The text styles object
 * @returns Array of ProseMirror marks
 */
export function stylesToMarks(schema: Schema, styles: TextStyles): readonly Mark[] {
  const marks: Mark[] = [];

  if (styles.bold && schema.marks.bold) {
    marks.push(schema.marks.bold.create());
  }
  if (styles.italic && schema.marks.italic) {
    marks.push(schema.marks.italic.create());
  }
  if (styles.underline && schema.marks.underline) {
    marks.push(schema.marks.underline.create());
  }
  if (styles.strikethrough && schema.marks.strikethrough) {
    marks.push(schema.marks.strikethrough.create());
  }
  if (styles.code && schema.marks.code) {
    marks.push(schema.marks.code.create());
  }

  return marks;
}

/**
 * Creates a document from an array of blocks.
 *
 * @param schema - The ProseMirror schema
 * @param blocks - Array of blocks (optional)
 * @returns A ProseMirror document node
 */
export function blocksToDoc(schema: Schema, blocks?: Block[]): PMNode {
  if (!blocks || blocks.length === 0) {
    // Create empty paragraph as default content
    return schema.node('doc', null, [
      schema.node('paragraph', { id: uuid() }),
    ]);
  }

  const nodes = blocks.map((block) => blockToNode(schema, block));
  return schema.node('doc', null, nodes);
}
