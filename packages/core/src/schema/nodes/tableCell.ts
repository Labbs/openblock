/**
 * TableCell node specification - A cell within a table row.
 *
 * A tableCell can contain block content (paragraphs, lists, etc.).
 *
 * Note: merged cells (colspan/rowspan) are NOT supported by the OpenBlock
 * table model - the table commands assume a strictly rectangular grid, so
 * the cell specs intentionally carry no colspan/rowspan attributes. Any
 * colspan/rowspan found in pasted HTML is ignored.
 *
 * @example
 * ```json
 * {
 *   "type": "tableCell",
 *   "attrs": { "id": "cell-1" },
 *   "content": [
 *     { "type": "paragraph", "content": [...] }
 *   ]
 * }
 * ```
 *
 * @module
 */

import { NodeSpec, DOMOutputSpec, Node as PMNode } from 'prosemirror-model';

import { getBlockIdAttrs, blockIdToDOM, safeParseInt } from '../blockIdAttrs';

/**
 * Reads the shared cell attributes (id, colwidth, backgroundColor) from a
 * DOM element (for parseDOM getAttrs).
 */
function getCellAttrs(dom: HTMLElement): Record<string, unknown> {
  const colwidth = dom.getAttribute('data-colwidth');
  const widths = colwidth
    ? colwidth
        .split(',')
        .map((w) => safeParseInt(w.trim(), null))
        .filter((w): w is number => w !== null)
    : [];

  return {
    ...getBlockIdAttrs(dom),
    colwidth: widths.length > 0 ? widths : null,
    backgroundColor: dom.style.backgroundColor || null,
  };
}

/**
 * Builds the shared DOM attributes (id, colwidth, backgroundColor) for a
 * cell node (for toDOM).
 */
function cellToDOMAttrs(node: PMNode, className: string): Record<string, string> {
  const attrs: Record<string, string> = {
    class: className,
    ...blockIdToDOM(node),
  };

  const styles: string[] = [];

  if (node.attrs.colwidth) {
    attrs['data-colwidth'] = node.attrs.colwidth.join(',');
    styles.push(`width: ${node.attrs.colwidth[0]}px`);
  }

  if (node.attrs.backgroundColor) {
    styles.push(`background-color: ${node.attrs.backgroundColor}`);
  }

  if (styles.length > 0) {
    attrs.style = styles.join('; ');
  }

  return attrs;
}

/**
 * Shared attribute specs for tableCell and tableHeader.
 */
function cellAttrs() {
  return {
    /** Unique block identifier */
    id: { default: null },
    /** Column width in pixels (null = auto) */
    colwidth: { default: null },
    /** Background color */
    backgroundColor: { default: null },
  };
}

/**
 * TableCell node spec for ProseMirror.
 *
 * Represents a cell within a table row.
 */
export const tableCellNode: NodeSpec = {
  content: 'block+',
  isolating: true,

  attrs: cellAttrs(),

  // Note: no 'th' rule here - <th> elements are parsed by tableHeaderNode.
  parseDOM: [
    {
      tag: 'td',
      getAttrs(dom: HTMLElement): Record<string, unknown> {
        return getCellAttrs(dom);
      },
    },
  ],

  toDOM(node: PMNode): DOMOutputSpec {
    return ['td', cellToDOMAttrs(node, 'ob-table-cell'), 0];
  },
};

/**
 * TableHeader node spec for ProseMirror.
 *
 * Represents a header cell within a table row.
 * Uses <th> instead of <td> for semantic HTML.
 */
export const tableHeaderNode: NodeSpec = {
  content: 'block+',
  isolating: true,

  attrs: cellAttrs(),

  parseDOM: [
    {
      tag: 'th',
      getAttrs(dom: HTMLElement): Record<string, unknown> {
        return getCellAttrs(dom);
      },
    },
  ],

  toDOM(node: PMNode): DOMOutputSpec {
    return ['th', cellToDOMAttrs(node, 'ob-table-header'), 0];
  },
};
