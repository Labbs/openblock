/**
 * Block type definitions for OpenBlock.
 *
 * Defines the JSON block format used for document serialization.
 *
 * @module
 */

/**
 * Text styles that can be applied to inline content.
 *
 * @example
 * ```typescript
 * const styles: TextStyles = { bold: true, italic: true };
 * ```
 */
export interface TextStyles {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  textColor?: string;
  backgroundColor?: string;
}

/**
 * Styled text content within a block.
 *
 * The basic unit of text with formatting applied.
 *
 * @example
 * ```typescript
 * const text: StyledText = {
 *   type: 'text',
 *   text: 'Hello world',
 *   styles: { bold: true }
 * };
 * ```
 */
export interface StyledText {
  type: 'text';
  text: string;
  styles: TextStyles;
}

/**
 * Link inline content.
 *
 * A hyperlink containing styled text.
 *
 * @example
 * ```typescript
 * const link: LinkContent = {
 *   type: 'link',
 *   href: 'https://example.com',
 *   content: [{ type: 'text', text: 'Click here', styles: {} }]
 * };
 * ```
 */
export interface LinkContent {
  type: 'link';
  href: string;
  title?: string;
  target?: '_blank' | '_self';
  content: StyledText[];
}

/**
 * Union of all inline content types.
 */
export type InlineContent = StyledText | LinkContent;

/**
 * A block in the document.
 *
 * Blocks are the fundamental unit of content in OpenBlock.
 * Each block has a unique ID, type, properties, and optional content/children.
 *
 * @example
 * ```typescript
 * const paragraph: Block = {
 *   id: 'abc123',
 *   type: 'paragraph',
 *   props: {},
 *   content: [{ type: 'text', text: 'Hello', styles: {} }]
 * };
 *
 * const heading: Block<'heading', { level: number }> = {
 *   id: 'xyz789',
 *   type: 'heading',
 *   props: { level: 2 },
 *   content: [{ type: 'text', text: 'Title', styles: {} }]
 * };
 * ```
 */
export interface Block<
  TType extends string = string,
  TProps extends Record<string, unknown> = Record<string, unknown>
> {
  /** Unique identifier for the block */
  id: string;
  /** Block type (paragraph, heading, etc.) */
  type: TType;
  /** Block-specific properties */
  props: TProps;
  /** Inline content (for blocks with text) */
  content?: InlineContent[];
  /** Child blocks (for container blocks like columns) */
  children?: Block[];
}

/**
 * Partial block for insertion/updates (id is optional).
 *
 * Used when creating new blocks - the ID will be auto-generated if not provided.
 */
export type PartialBlock<
  TType extends string = string,
  TProps extends Record<string, unknown> = Record<string, unknown>
> = Omit<Block<TType, TProps>, 'id'> & { id?: string };

/**
 * Block identifier - can be a block ID string or block object.
 *
 * Used in API methods that accept either format.
 */
export type BlockIdentifier = string | Block;

/**
 * Placement for block insertion.
 */
export type BlockPlacement = 'before' | 'after' | 'nested';
