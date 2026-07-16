/**
 * Shared helpers for the block `id` attribute and safe attribute parsing.
 *
 * Every OpenBlock node carries an optional `id` attribute persisted in the
 * DOM as `data-block-id`. These helpers keep the attr spec, parseDOM reading
 * and toDOM emission consistent across all node specs:
 * - the attribute is read back from `data-block-id` on paste/parse,
 * - it is omitted from the DOM output when the node has no id.
 *
 * @module
 */

import type { AttributeSpec, Node as PMNode } from 'prosemirror-model';

/**
 * Attribute spec for the block `id` attribute (defaults to null).
 *
 * Usage in a NodeSpec: `attrs: { ...blockIdAttr(), other: { ... } }`.
 */
export function blockIdAttr(): { id: AttributeSpec } {
  return { id: { default: null } };
}

/**
 * Reads the block id back from a DOM element (for parseDOM getAttrs).
 */
export function getBlockIdAttrs(dom: HTMLElement): { id: string | null } {
  return { id: dom.getAttribute('data-block-id') };
}

/**
 * Returns the `data-block-id` DOM attribute for a node (for toDOM).
 *
 * The attribute is omitted entirely when the node has no id.
 */
export function blockIdToDOM(node: PMNode): Record<string, string> {
  return node.attrs.id ? { 'data-block-id': String(node.attrs.id) } : {};
}

/**
 * Safely parses an integer attribute value.
 *
 * @param value - Raw attribute value (may be null/undefined/garbage)
 * @param fallback - Value returned when parsing fails
 * @returns The parsed integer, or the fallback if the value is missing or NaN
 */
export function safeParseInt<T>(value: string | null | undefined, fallback: T): number | T {
  if (value == null || value === '') return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
