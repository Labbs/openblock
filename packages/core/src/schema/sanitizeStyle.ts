/**
 * CSS value sanitization helpers for the OpenBlock schema.
 *
 * Node and mark attributes can reach `toDOM` without going through
 * `parseDOM`: from JSON (`setDocument`, `insertBlocks`), from a
 * collaboration peer (Y.js) or from raw `data-*` attributes in pasted HTML.
 * Interpolating such values into a `style` attribute unchecked allows CSS
 * injection (e.g. `red; background-image: url(https://tracker)` or a
 * full-page `position: fixed` overlay). These helpers whitelist the value
 * formats each attribute actually needs.
 *
 * @module
 */

/** Maximum accepted length for a CSS color value. */
const MAX_COLOR_LENGTH = 64;

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
/**
 * Color functions. Arguments may only contain digits, letters (units,
 * `none`), whitespace, `.`, `%`, `,`, `/`, `+` and `-`: no parentheses,
 * quotes, colons, semicolons or backslashes, so nothing can escape the
 * declaration.
 */
const COLOR_FUNCTION_RE = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([\w\s.%,/+-]*\)$/i;
/** Named colors and keywords such as `transparent` or `currentcolor`. */
const NAMED_COLOR_RE = /^[a-z]+$/i;
/** Custom property reference, e.g. `var(--ob-highlight)`. */
const CSS_VAR_RE = /^var\(--[\w-]+\)$/i;

/**
 * Validates a CSS color value.
 *
 * Accepts hex colors, color functions (`rgb()`, `hsl()`, `oklch()`...),
 * named colors and `var(--custom-property)` references.
 *
 * @returns The trimmed color if safe, or null if it must be rejected.
 */
export function sanitizeCssColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const color = value.trim();
  if (color.length === 0 || color.length > MAX_COLOR_LENGTH) return null;
  if (
    HEX_COLOR_RE.test(color) ||
    COLOR_FUNCTION_RE.test(color) ||
    NAMED_COLOR_RE.test(color) ||
    CSS_VAR_RE.test(color)
  ) {
    return color;
  }
  return null;
}

/** Text alignment values accepted on text blocks ('justify' can come from pasted HTML). */
type TextAlignValue = 'left' | 'center' | 'right' | 'justify';

const TEXT_ALIGNS: ReadonlySet<string> = new Set<TextAlignValue>(['left', 'center', 'right', 'justify']);

/**
 * Normalizes a text alignment value; anything unknown becomes 'left'.
 */
export function sanitizeTextAlign(value: unknown): TextAlignValue {
  return typeof value === 'string' && TEXT_ALIGNS.has(value) ? (value as TextAlignValue) : 'left';
}

/**
 * Converts a value to a finite, non-negative number.
 *
 * Accepts numbers and numeric strings (as found in JSON or `data-*`
 * attributes).
 *
 * @returns The number, or null if the value is not a finite number >= 0.
 */
export function toNonNegativeNumber(value: unknown): number | null {
  const num = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof num === 'number' && Number.isFinite(num) && num >= 0 ? num : null;
}
