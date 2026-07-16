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

  // Empty children arrays are treated as absent (avoids invalid empty containers)
  const children = block.children && block.children.length > 0 ? block.children : null;

  // Handle list items specially - they need a paragraph wrapper for inline content,
  // followed by any nested blocks (sub-lists) as siblings of that paragraph
  if (block.type === 'listItem') {
    const paragraph = schema.node('paragraph', null, inlineContentToNodes(schema, block.content || []));
    const childNodes = children ? children.map((child) => blockToNode(schema, child)) : [];
    return nodeType.create(attrs, [paragraph, ...childNodes]);
  }

  // Handle container blocks with children (lists, columns, etc.)
  if (children) {
    const childNodes = children.map((child) => blockToNode(schema, child));
    return nodeType.create(attrs, childNodes);
  }

  // Handle check list items - they have inline content directly
  if (block.type === 'checkListItem' && block.content) {
    return nodeType.create(attrs, inlineContentToNodes(schema, block.content));
  }

  // Handle image blocks - they are atomic and use props for src, alt, etc.
  if (block.type === 'image') {
    return nodeType.create(attrs);
  }

  // Handle table cells - they need block content (default to paragraph if only inline content)
  if ((block.type === 'tableCell' || block.type === 'tableHeader') && block.content && !children) {
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
  const nodes: PMNode[] = [];

  for (const item of content) {
    if (item.type === 'text') {
      // ProseMirror does not allow empty text nodes
      if (!item.text) {
        continue;
      }
      const marks = stylesToMarks(schema, item.styles);
      nodes.push(schema.text(item.text, marks));
    } else if (item.type === 'link') {
      const linkMark = schema.marks.link?.create({
        href: item.href,
        title: item.title ?? null,
        target: item.target ?? null,
      });
      for (const child of item.content) {
        // ProseMirror does not allow empty text nodes
        if (!child.text) {
          continue;
        }
        const marks = stylesToMarks(schema, child.styles);
        nodes.push(schema.text(child.text, linkMark ? [...marks, linkMark] : marks));
      }
    } else if (item.type === 'hardBreak' && schema.nodes.hardBreak) {
      nodes.push(schema.nodes.hardBreak.create());
    }
  }

  return nodes;
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
  if (styles.textColor && schema.marks.textColor) {
    marks.push(schema.marks.textColor.create({ color: styles.textColor }));
  }
  if (styles.backgroundColor && schema.marks.backgroundColor) {
    marks.push(schema.marks.backgroundColor.create({ color: styles.backgroundColor }));
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
