/**
 * ProseMirror node to Block conversion.
 *
 * @module
 */

import { Node as PMNode, Mark } from 'prosemirror-model';

import type { Block, InlineContent, LinkContent, StyledText, TextStyles } from './types';

/**
 * Container node types that have block children instead of inline content.
 */
const CONTAINER_TYPES = new Set([
  'bulletList',
  'orderedList',
  'listItem',
  'checkList',
  'checkListItem',
  'columnList',
  'column',
  'table',
  'tableRow',
  'tableCell',
  'tableHeader',
]);

/**
 * Converts a ProseMirror node to a Block.
 *
 * This is the reverse transformation that takes a ProseMirror node
 * and produces our JSON block format for serialization.
 *
 * Handles both simple blocks (paragraph, heading) and container blocks
 * (lists, columns) that have nested children.
 *
 * @example
 * ```typescript
 * const block = nodeToBlock(node);
 * console.log(block);
 * // { id: 'abc', type: 'paragraph', props: {}, content: [...] }
 * ```
 *
 * @param node - The ProseMirror node
 * @returns A Block object
 */
export function nodeToBlock(node: PMNode): Block {
  const { id, ...props } = node.attrs;

  const block: Block = {
    // Do not invent ids at serialization time: nodes without an id (the
    // blockIdPlugin assigns them at runtime) serialize with an empty id so
    // repeated conversions of the same document stay stable.
    id: id || '',
    type: node.type.name,
    props,
  };

  // Handle container blocks with block children
  if (CONTAINER_TYPES.has(node.type.name)) {
    // List items: extract inline content from first paragraph, rest as children
    if (node.type.name === 'listItem') {
      const firstChild = node.firstChild;
      if (firstChild && firstChild.isTextblock) {
        block.content = nodeContentToInline(firstChild);
      }
      // If there are nested lists or other blocks, add as children
      if (node.childCount > 1) {
        const children: Block[] = [];
        node.forEach((child, _offset, index) => {
          if (index > 0) {
            children.push(nodeToBlock(child));
          }
        });
        block.children = children;
      }
    } else if (node.type.name === 'checkListItem') {
      // Check list items have inline content directly (not wrapped in paragraph)
      block.content = nodeContentToInline(node);
    } else if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      // Table cells: all block children become children
      const cellChildren: Block[] = [];
      node.forEach((child) => {
        cellChildren.push(nodeToBlock(child));
      });
      block.children = cellChildren;
    } else {
      // Lists, tables, tableRows: all children become block children
      const blockChildren: Block[] = [];
      node.forEach((child) => {
        blockChildren.push(nodeToBlock(child));
      });
      block.children = blockChildren;
    }
    return block;
  }

  // Extract inline content from text blocks
  if (node.isTextblock && node.content.size > 0) {
    block.content = nodeContentToInline(node);
  }

  return block;
}

/**
 * Extracts inline content from a text block node.
 *
 * @param node - A text block node
 * @returns Array of inline content
 */
function nodeContentToInline(node: PMNode): InlineContent[] {
  const content: InlineContent[] = [];

  node.content.forEach((child) => {
    if (child.isText) {
      const linkMark = child.marks.find((mark) => mark.type.name === 'link');
      const styledText: StyledText = {
        type: 'text',
        text: child.text || '',
        styles: marksToStyles(child.marks),
      };

      if (linkMark) {
        const previous = content[content.length - 1];
        // Merge consecutive text nodes carrying the same link mark into one link item
        if (
          previous &&
          previous.type === 'link' &&
          previous.href === linkMark.attrs.href &&
          (previous.title ?? null) === (linkMark.attrs.title ?? null) &&
          (previous.target ?? null) === (linkMark.attrs.target ?? null)
        ) {
          previous.content.push(styledText);
        } else {
          const link: LinkContent = {
            type: 'link',
            href: linkMark.attrs.href,
            content: [styledText],
          };
          if (linkMark.attrs.title) {
            link.title = linkMark.attrs.title;
          }
          if (linkMark.attrs.target) {
            link.target = linkMark.attrs.target;
          }
          content.push(link);
        }
      } else {
        content.push(styledText);
      }
    } else if (child.type.name === 'hardBreak') {
      content.push({ type: 'hardBreak' });
    }
    // Other non-text inline nodes have no block representation and are skipped
  });

  return content;
}

/**
 * Converts ProseMirror marks to text styles.
 *
 * @param marks - Array of ProseMirror marks
 * @returns A TextStyles object
 */
export function marksToStyles(marks: readonly Mark[]): TextStyles {
  const styles: TextStyles = {};

  for (const mark of marks) {
    switch (mark.type.name) {
      case 'bold':
        styles.bold = true;
        break;
      case 'italic':
        styles.italic = true;
        break;
      case 'underline':
        styles.underline = true;
        break;
      case 'strikethrough':
        styles.strikethrough = true;
        break;
      case 'code':
        styles.code = true;
        break;
      case 'textColor':
        styles.textColor = mark.attrs.color;
        break;
      case 'backgroundColor':
        styles.backgroundColor = mark.attrs.color;
        break;
      // Link marks are serialized as `link` inline content items
      // (see nodeContentToInline), not as text styles
    }
  }

  return styles;
}

/**
 * Converts a document to an array of blocks.
 *
 * @param doc - The ProseMirror document node
 * @returns Array of blocks
 */
export function docToBlocks(doc: PMNode): Block[] {
  const blocks: Block[] = [];

  doc.forEach((node) => {
    blocks.push(nodeToBlock(node));
  });

  return blocks;
}
